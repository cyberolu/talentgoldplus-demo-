import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import {
  db,
} from "../core/firebase-admin";


const DAY_MS =
    24 * 60 * 60 * 1000;

const SEVEN_DAYS_MS =
    7 * DAY_MS;

const NINETY_DAYS_MS =
    90 * DAY_MS;


export const renewMarketplaceListing =
    onCall(async (request) => {
      /* =========================
         AUTH
      ========================= */

      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in to renew a listing."
        );
      }


      const userId =
        request.auth.uid;


      /* =========================
         INPUT
      ========================= */

      const listingId =
        request.data?.listingId;


      if (
        typeof listingId !== "string" ||
        !listingId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid listing ID is required."
        );
      }


      /* =========================
         LISTING
      ========================= */

      const listingReference =
        db
          .collection(
            "marketplaceListings"
          )
          .doc(
            listingId
          );


      const listingSnapshot =
        await listingReference.get();


      if (!listingSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "Marketplace listing not found."
        );
      }


      const listingData =
        listingSnapshot.data() ||
        {};


      /* =========================
         OWNER CHECK
      ========================= */

      const ownerId =
        listingData.userId ||
        listingData.ownerId ||
        listingData.createdBy ||
        "";


      if (
        ownerId !== userId
      ) {
        throw new HttpsError(
          "permission-denied",
          "You can only renew your own Marketplace listings."
        );
      }


      /* =========================
         STATUS CHECK
      ========================= */

      if (
        listingData.status !==
        "expired"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only expired Marketplace listings can be renewed."
        );
      }


      /* =========================
         RENEWAL WINDOW
      ========================= */

      const expiredAt =
        listingData.expiredAt;


      if (
        !expiredAt ||
        typeof expiredAt.toMillis !==
          "function"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This listing does not contain a valid expiry date."
        );
      }


      const renewalDeadline =
        expiredAt.toMillis() +
        SEVEN_DAYS_MS;


      if (
        Date.now() >
        renewalDeadline
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The 7-day renewal period for this listing has ended."
        );
      }


      /* =========================
         NEW EXPIRY
      ========================= */

      const renewedAt =
        Timestamp.now();


      const expiresAt =
        Timestamp.fromMillis(
          renewedAt.toMillis() +
          NINETY_DAYS_MS
        );


      const batch =
        db.batch();


      /* =========================
         RENEW LISTING
      ========================= */

      batch.update(
        listingReference,
        {

          status:
            "approved",

          renewedAt,

          renewedBy:
            userId,

          expiresAt,

          expiredAt:
            null,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         AUDIT
      ========================= */

      const auditReference =
        db
          .collection(
            "auditLogs"
          )
          .doc();


      batch.set(
        auditReference,
        {

          action:
            "marketplace_listing_renewed",

          itemId:
            listingId,

          collectionName:
            "marketplaceListings",

          previousStatus:
            "expired",

          newStatus:
            "approved",

          performedBy:
            userId,

          performedByRole:
            "owner",

          renewedAt,

          expiresAt,

          createdAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         NOTIFICATION
      ========================= */

      const notificationReference =
        db
          .collection(
            "notifications"
          )
          .doc();


      batch.set(
        notificationReference,
        {

          userId,

          type:
            "marketplace_listing_renewed",

          title:
            "Marketplace listing renewed",

          message:
            "Your Marketplace listing has been renewed for another 90 days.",

          itemId:
            listingId,

          collectionName:
            "marketplaceListings",

          read:
            false,

          createdAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         SAVE
      ========================= */

      await batch.commit();


      return {

        success:
          true,

        listingId,

        status:
          "approved",

        expiresAt:
          expiresAt.toMillis(),

      };
    });
