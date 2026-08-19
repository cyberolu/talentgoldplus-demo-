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

export const rejectUserAccount =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const userId =
        request.data?.userId;

      const reason =
        request.data?.reason;

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
        typeof reason !== "string" ||
        !reason.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A rejection reason is required."
        );
      }

      if (
        userId === admin.userId
      ) {
        throw new HttpsError(
          "failed-precondition",
          "You cannot reject your own account."
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
          "Only pending accounts can be rejected."
        );
      }

      const cleanReason =
        reason.trim();

      const batch =
        db.batch();

      batch.update(
        userRef,
        {
          status:
            "rejected",

          approvalStatus:
            "rejected",

          rejectionReason:
            cleanReason,

          rejectedBy:
            admin.userId,

          rejectedAt:
            FieldValue.serverTimestamp(),

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
            "user_account_rejected",

          userId,

          reason:
            cleanReason,

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
            "account_rejected",

          title:
            "Account application not approved",

          message:
            "Your TalentGoldPlus registration was not approved.",

          reason:
            cleanReason,

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
        status: "rejected",
        reason: cleanReason,
      };
    });
