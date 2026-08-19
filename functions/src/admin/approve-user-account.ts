import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  db,
} from "../core/firebase-admin";

import {
  requireAdmin,
} from "../core/auth-helpers";

export const approveUserAccount =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const userId =
        request.data?.userId;

      if (
        typeof userId !== "string" ||
        !userId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid user ID is required."
        );
      }

      if (
        userId === admin.userId
      ) {
        throw new HttpsError(
          "failed-precondition",
          "You cannot approve your own account."
        );
      }

      const userRef =
        db
          .collection("users")
          .doc(userId);

      const userSnapshot =
        await userRef.get();

      if (!userSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "User not found."
        );
      }

      const userData =
        userSnapshot.data();

      const currentStatus =
        (
          userData?.status ||
          "active"
        ).toLowerCase();

      if (
        currentStatus !== "pending" &&
        currentStatus !== "under-review"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only pending accounts can be approved."
        );
      }

      const batch =
        db.batch();

      batch.update(
        userRef,
        {
          status:
            "active",

          approvalStatus:
            "approved",

          approvedBy:
            admin.userId,

          approvedAt:
            FieldValue.serverTimestamp(),

          rejectionReason:
            "",

          updatedAt:
            FieldValue.serverTimestamp(),
        }
      );

      const auditRef =
        db
          .collection("auditLogs")
          .doc();

      batch.set(
        auditRef,
        {
          action:
            "user_account_approved",

          userId,

          performedBy:
            admin.userId,

          performedByRole:
            admin.role,

          createdAt:
            FieldValue.serverTimestamp(),
        }
      );

      const notificationRef =
        db
          .collection("notifications")
          .doc();

      batch.set(
        notificationRef,
        {
          userId,

          type:
            "account_approved",

          title:
            "Account approved",

          message:
            "Your TalentGoldPlus account has been approved. You can now access the platform.",

          read:
            false,

          createdAt:
            FieldValue.serverTimestamp(),
        }
      );

      await batch.commit();

      return {
        success: true,
        userId,
        status: "active",
      };
    });
