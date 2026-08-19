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

export const approveOpportunity =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const opportunityId =
        request.data?.opportunityId;

      if (
        typeof opportunityId !== "string" ||
        !opportunityId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid opportunity ID is required."
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
          "Only pending opportunities can be approved."
        );
      }

      const ownerId =
        opportunity?.createdBy;

      const batch =
        db.batch();

      batch.update(
        opportunityRef,
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
          action: "opportunity_approved",
          opportunityId,
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
            type: "opportunity_approved",
            title: "Opportunity approved",
            message:
              `Your opportunity "${opportunity?.title || "Opportunity"}" has been approved.`,
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
        status: "approved",
      };
    });
