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

export const approveFundraiser =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const fundraiserId =
        request.data?.fundraiserId;

      if (
        typeof fundraiserId !== "string" ||
        !fundraiserId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid fundraiser ID is required."
        );
      }

      const fundraiserRef =
        db
          .collection("fundraisers")
          .doc(fundraiserId);

      const snapshot =
        await fundraiserRef.get();

      if (!snapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Fundraiser not found."
        );
      }

      const fundraiser =
        snapshot.data();

      if (
        fundraiser?.status !== "pending"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only pending fundraisers can be approved."
        );
      }

      const ownerId =
        fundraiser?.createdBy;

      const batch =
        db.batch();

      batch.update(
        fundraiserRef,
        {
          status: "approved",
          approvedBy: admin.userId,
          approvedAt:
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
          action: "fundraiser_approved",
          fundraiserId,
          performedBy: admin.userId,
          performedByRole: admin.role,
          createdAt:
            FieldValue.serverTimestamp(),
        }
      );

      if (
        typeof ownerId === "string" &&
        ownerId.trim()
      ) {
        const notificationRef =
          db
            .collection("notifications")
            .doc();

        batch.set(
          notificationRef,
          {
            userId: ownerId,
            type: "fundraiser_approved",
            title: "Fundraiser approved",
            message:
              `Your fundraiser "${fundraiser?.title || "Fundraiser"}" has been approved.`,
            fundraiserId,
            read: false,
            createdAt:
              FieldValue.serverTimestamp(),
          }
        );
      }

      await batch.commit();

      return {
        success: true,
        fundraiserId,
        status: "approved",
      };
    });
