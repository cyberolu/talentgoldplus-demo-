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

import {
  createArchiveRecord,
} from "../core/archive-record";


const allowedCollections = [
  "marketplaceListings",
  "events",
  "opportunities",
  "fundraisers",
];


const allowedTypes = [
  "marketplace",
  "event",
  "opportunity",
  "fundraiser",
];


const allowedLiveStatuses = [
  "approved",
  "published",
];


export const archiveApprovedContent =
  onCall(
    async (
      request
    ) => {
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

      const itemId =
        request.data?.itemId;

      const collectionName =
        request.data?.collectionName;

      const itemType =
        request.data?.itemType;


      if (
        typeof itemId !== "string" ||
        !itemId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid content ID is required."
        );
      }


      if (
        typeof collectionName !== "string" ||
        !allowedCollections.includes(
          collectionName
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "This content collection is not supported."
        );
      }


      if (
        typeof itemType !== "string" ||
        !allowedTypes.includes(
          itemType
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "This content type is not supported."
        );
      }


      /* =========================
         CONTENT
      ========================= */

      const itemReference =
        db
          .collection(
            collectionName
          )
          .doc(
            itemId
          );


      const itemSnapshot =
        await itemReference.get();


      if (
        !itemSnapshot.exists
      ) {
        throw new HttpsError(
          "not-found",
          "Content not found."
        );
      }


      const itemData =
        itemSnapshot.data() ||
        {};


      /* =========================
         LIVE STATUS CHECK
      ========================= */

      if (
        !allowedLiveStatuses.includes(
          itemData.status
        )
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only live approved content can be archived."
        );
      }


      const previousStatus =
        itemData.status;


      /* =========================
         DELETE DATE
      ========================= */

      const deleteAt =
        Timestamp.fromMillis(
          Date.now() +
          (
            90 *
            24 *
            60 *
            60 *
            1000
          )
        );


      /* =========================
         BATCH
      ========================= */

      const batch =
        db.batch();


      /* =========================
         ARCHIVE ITEM
      ========================= */

      batch.update(
        itemReference,
        {

          status:
            "archived",

          archivedAt:
            FieldValue.serverTimestamp(),

          archivedBy:
            admin.userId,

          archiveReason:
            "manual_admin_archive",

          deleteAt,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         ARCHIVE RECORD
      ========================= */

      createArchiveRecord({

        batch,

        collectionName,

        itemId,

        data:
          itemData,

        previousStatus,

        archiveReason:
          "manual_admin_archive",

        archivedBy:
          admin.userId,

        deleteAt,

      });


      /* =========================
         AUDIT LOG
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
            "approved_content_archived",

          itemId,

          itemType,

          collectionName,

          previousStatus,

          newStatus:
            "archived",

          archiveReason:
            "manual_admin_archive",

          deleteAt,

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
        itemData.userId ||
        itemData.ownerId ||
        itemData.createdBy ||
        itemData.creatorId ||
        itemData.organiserId ||
        "";


      if (
        typeof ownerId === "string" &&
        ownerId.trim()
      ) {
        const notificationReference =
          db
            .collection(
              "notifications"
            )
            .doc();


        batch.set(
          notificationReference,
          {

            userId:
              ownerId,

            type:
              "content_archived",

            title:
              "Content archived",

            message:
              "One of your approved submissions has been archived by TalentGoldPlus.",

            itemId,

            itemType,

            collectionName,

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

        itemId,

        itemType,

        collectionName,

        previousStatus,

        status:
          "archived",

        deleteAt:
          deleteAt.toDate().toISOString(),

      };
    }
  );
