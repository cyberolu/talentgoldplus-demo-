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

export const rejectFundraiser =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const fundraiserId =
        request.data?.fundraiserId;

      const reason =
        request.data?.reason;

      if (
        typeof fundraiserId !== "string" ||
        !fundraiserId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid fundraiser ID is required."
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
          "Only pending fundraisers can be rejected."
        );
      }

      const ownerId =
        fundraiser?.createdBy;

      const cleanReason =
        reason.trim();

      const batch =
        db.batch();

      batch.update(
        fundraiserRef,
        {
          status: "rejected",
          rejectionReason: cleanReason,
          rejectedBy: admin.userId,
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
          action: "fundraiser_rejected",
          fundraiserId,
          reason: cleanReason,
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
            type: "fundraiser_rejected",
            title: "Fundraiser rejected",
            message:
              `Your fundraiser "${fundraiser?.title || "Fundraiser"}" was not approved.`,
            reason: cleanReason,
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
        status: "rejected",
        reason: cleanReason,
      };
    });
