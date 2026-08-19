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

export const rejectEvent =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);

      const eventId =
        request.data?.eventId;

      const reason =
        request.data?.reason;

      if (
        typeof eventId !== "string" ||
        !eventId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid event ID is required."
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

      const eventRef =
        db
          .collection("events")
          .doc(eventId);

      const eventSnapshot =
        await eventRef.get();

      if (!eventSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Event not found."
        );
      }

      const event =
        eventSnapshot.data();

      if (event?.status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "Only pending events can be rejected."
        );
      }

      const organiserId =
        event?.organiserId;

      const cleanReason =
        reason.trim();

      const batch =
        db.batch();

      batch.update(
        eventRef,
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
          action: "event_rejected",
          eventId,
          reason: cleanReason,
          performedBy: admin.userId,
          performedByRole: admin.role,
          createdAt:
            FieldValue.serverTimestamp(),
        }
      );

      if (
        typeof organiserId === "string" &&
        organiserId.trim()
      ) {
        const notificationRef =
          db
            .collection("notifications")
            .doc();

        batch.set(
          notificationRef,
          {
            userId: organiserId,
            type: "event_rejected",
            title: "Event rejected",
            message:
              `Your event "${event?.title || "Event"}" was not approved.`,
            reason: cleanReason,
            eventId,
            read: false,
            createdAt:
              FieldValue.serverTimestamp(),
          }
        );
      }

      await batch.commit();

      return {
        success: true,
        eventId,
        status: "rejected",
        reason: cleanReason,
      };
    });
