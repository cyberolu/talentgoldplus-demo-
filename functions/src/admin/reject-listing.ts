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

export const rejectListing =
    onCall(
      async (request) => {
        const admin =
          await requireAdmin(request);

        const listingId =
          request.data?.listingId;

        const reason =
          request.data?.reason;

        if (
          typeof listingId !== "string" ||
          !listingId.trim()
        ) {
          throw new HttpsError(
            "invalid-argument",
            "A valid listing ID is required."
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

        const listingRef =
          db
            .collection("marketplaceListings")
            .doc(listingId);

        const listingSnapshot =
          await listingRef.get();

        if (!listingSnapshot.exists) {
          throw new HttpsError(
            "not-found",
            "Marketplace listing not found."
          );
        }

        const listing =
          listingSnapshot.data();

        if (
          listing?.status !== "pending"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Only pending marketplace listings can be rejected."
          );
        }

        const ownerId =
          listing?.userId;

        if (
          typeof ownerId !== "string" ||
          !ownerId.trim()
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Listing owner could not be identified."
          );
        }

        const cleanReason =
          reason.trim();

        await listingRef.update({
          status: "rejected",

          rejectionReason:
            cleanReason,

          rejectedBy:
            admin.userId,

          rejectedAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

        await db
          .collection("auditLogs")
          .add({
            action:
              "marketplace_listing_rejected",

            listingId,

            reason:
              cleanReason,

            performedBy:
              admin.userId,

            performedByRole:
              admin.role,

            createdAt:
              FieldValue.serverTimestamp(),
          });

        await db
          .collection("notifications")
          .add({
            userId:
              ownerId,

            type:
              "marketplace_listing_rejected",

            title:
              "Marketplace listing rejected",

            message:
              `Your listing "${listing?.title || "Marketplace listing"}" was not approved.`,

            reason:
              cleanReason,

            listingId,

            read:
              false,

            createdAt:
              FieldValue.serverTimestamp(),
          });

        return {
          success: true,
          listingId,
          status: "rejected",
          reason:
            cleanReason,
        };
      }
    );
