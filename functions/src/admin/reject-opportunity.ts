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

export const rejectOpportunity =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const opportunityId =
        request.data?.opportunityId;

      const reason =
        request.data?.reason;

      if (
        typeof opportunityId !== "string" ||
        !opportunityId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid opportunity ID is required."
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

      const opportunityRef =
        db
          .collection("opportunities")
          .doc(opportunityId);

      const snapshot =
        await opportunityRef.get();

      if (!snapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Opportunity not found."
        );
      }

      const opportunity =
        snapshot.data();

      if (
        opportunity?.status !== "pending"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only pending opportunities can be rejected."
        );
      }

      const ownerId =
        opportunity?.createdBy;

      const cleanReason =
        reason.trim();

      const batch =
        db.batch();

      batch.update(
        opportunityRef,
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
          action: "opportunity_rejected",
          opportunityId,
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
            type: "opportunity_rejected",
            title: "Opportunity rejected",
            message:
              `Your opportunity "${opportunity?.title || "Opportunity"}" was not approved.`,
            reason: cleanReason,
            opportunityId,
            read: false,
            createdAt:
              FieldValue.serverTimestamp(),
          }
        );
      }

      await batch.commit();

      return {
        success: true,
        opportunityId,
        status: "rejected",
        reason: cleanReason,
      };
    });
