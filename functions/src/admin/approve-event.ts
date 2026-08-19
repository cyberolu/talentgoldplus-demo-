import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  db,
} from "../core/firebase-admin";

import {
  requireAdmin,
} from "../core/auth-helpers";

export const approveEvent =
    onCall(
      async (request) => {
        const admin =
          await requireAdmin(
            request
          );

        const eventId =
          request.data?.eventId;

        if (
          typeof eventId !== "string" ||
          !eventId.trim()
        ) {
          throw new HttpsError(
            "invalid-argument",
            "A valid event ID is required."
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

        if (
          event?.status !== "pending"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Only pending events can be approved."
          );
        }

        await eventRef.update({
          status: "published",
          approvedBy:
            admin.userId,
          approvedAt:
            new Date(),
          updatedAt:
            new Date(),
        });

        await db
          .collection("auditLogs")
          .add({
            action:
              "event_approved",

            eventId,

            performedBy:
              admin.userId,

            performedByRole:
              admin.role,

            createdAt:
              new Date(),
          });

        return {
          success: true,
          eventId,
          status: "published",
        };
      }
    );
