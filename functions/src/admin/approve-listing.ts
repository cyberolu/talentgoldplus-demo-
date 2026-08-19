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

import {
  requireAdmin,
} from "../core/auth-helpers";


const DAY_MS =
  24 * 60 * 60 * 1000;

const NINETY_DAYS_MS =
  90 * DAY_MS;


export const approveListing =
  onCall(
    async (request) => {
      /* =========================
         ADMIN CHECK
      ========================= */

      const admin =
        await requireAdmin(
          request
        );


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

      const listingRef =
        db
          .collection(
            "marketplaceListings"
          )
          .doc(
            listingId
          );


      const listingSnapshot =
        await listingRef.get();


      if (
        !listingSnapshot.exists
      ) {
        throw new HttpsError(
          "not-found",
          "Marketplace listing not found."
        );
      }


      const listing =
        listingSnapshot.data() ||
        {};


      if (
        listing.status !==
        "pending"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only pending marketplace listings can be approved."
        );
      }


      /* =========================
         APPROVAL / EXPIRY DATES
      ========================= */

      const approvedAt =
        Timestamp.now();


      const expiresAt =
        Timestamp.fromMillis(
          approvedAt.toMillis() +
          NINETY_DAYS_MS
        );


      /* =========================
         BATCH
      ========================= */

      const batch =
        db.batch();


      batch.update(
        listingRef,
        {

          status:
            "approved",

          approvedBy:
            admin.userId,

          approvedAt,

          expiresAt,

          expiredAt:
            null,

          renewedAt:
            null,

          renewedBy:
            "",

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         AUDIT LOG
      ========================= */

      const auditRef =
        db
          .collection(
            "auditLogs"
          )
          .doc();


      batch.set(
        auditRef,
        {

          action:
            "marketplace_listing_approved",

          listingId,

          collectionName:
            "marketplaceListings",

          previousStatus:
            "pending",

          newStatus:
            "approved",

          approvedAt,

          expiresAt,

          performedBy:
            admin.userId,

          performedByRole:
            admin.role,

          createdAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         OWNER NOTIFICATION
      ========================= */

      const ownerId =
        listing.userId ||
        listing.ownerId ||
        listing.createdBy ||
        "";


      if (
        typeof ownerId === "string" &&
        ownerId.trim()
      ) {
        const notificationRef =
          db
            .collection(
              "notifications"
            )
            .doc();


        batch.set(
          notificationRef,
          {

            userId:
              ownerId,

            type:
              "marketplace_listing_approved",

            title:
              "Marketplace listing approved",

            message:
              "Your Marketplace listing has been approved and will remain live for 90 days.",

            itemId:
              listingId,

            collectionName:
              "marketplaceListings",

            expiresAt,

            read:
              false,

            createdAt:
              FieldValue.serverTimestamp(),

          }
        );
      }


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

        approvedAt:
          approvedAt.toMillis(),

        expiresAt:
          expiresAt.toMillis(),

      };
    }
  );
