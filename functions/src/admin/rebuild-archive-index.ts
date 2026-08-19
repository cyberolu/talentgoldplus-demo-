import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  Timestamp,
} from "firebase-admin/firestore";

import {
  db,
} from "../core/firebase-admin";

import {
  requireAdmin,
} from "../core/auth-helpers";

import {
  getArchiveRecordId,
  getArchiveTitle,
  getArchiveOwnerId,
  getArchiveOwnerName,
  getContentType,
} from "../core/archive-record";


const collections = [
  "marketplaceListings",
  "events",
  "opportunities",
  "fundraisers",
];


export const rebuildArchiveIndex =
  onCall(
    async (
      request
    ) => {
      /* =========================
         SUPERADMIN CHECK
      ========================= */

      const admin =
        await requireAdmin(
          request
        );


      if (
        admin.role !==
        "superadmin"
      ) {
        throw new HttpsError(
          "permission-denied",
          "Only a superadmin can rebuild the archive index."
        );
      }


      let indexed =
        0;


      /* =========================
         SCAN COLLECTIONS
      ========================= */

      for (
        const collectionName
        of collections
      ) {
        const snapshot =
          await db
            .collection(
              collectionName
            )
            .where(
              "status",
              "==",
              "archived"
            )
            .get();


        console.log(
          `Archive rebuild: ${collectionName} found ${snapshot.size} archived documents.`
        );


        /* =========================
           BUILD ARCHIVE RECORDS
        ========================= */

        for (
          const documentSnapshot
          of snapshot.docs
        ) {
          const data =
            documentSnapshot.data();


          const recordId =
            getArchiveRecordId(
              collectionName,
              documentSnapshot.id
            );


          const recordReference =
            db
              .collection(
                "archiveRecords"
              )
              .doc(
                recordId
              );


          /* =========================
             ORIGINAL ARCHIVED DATE
          ========================= */

          const archivedAt =
            data.archivedAt instanceof Timestamp ?
              data.archivedAt :
              Timestamp.now();


          /* =========================
             DELETE DATE
          ========================= */

          const deleteAt =
            data.deleteAt instanceof Timestamp ?
              data.deleteAt :
              Timestamp.fromMillis(
                archivedAt.toMillis() +
                  (
                    90 *
                    24 *
                    60 *
                    60 *
                    1000
                  )
              );


          /* =========================
             PREVIOUS STATUS
          ========================= */

          let previousStatus =
            data.previousStatus ||
            "approved";


          /*
            Events use "published"
            as their live status.
          */

          if (
            collectionName ===
            "events"
          ) {
            previousStatus =
              "published";
          }


          /* =========================
             CREATE / UPDATE RECORD
          ========================= */

          await recordReference.set(
            {

              itemId:
                documentSnapshot.id,

              collectionName,

              contentType:
                getContentType(
                  collectionName
                ),

              title:
                getArchiveTitle(
                  data
                ),

              ownerId:
                getArchiveOwnerId(
                  data
                ),

              ownerName:
                getArchiveOwnerName(
                  data
                ),

              previousStatus,

              archiveReason:
                data.archiveReason ||
                "manual_admin_archive",

              archivedBy:
                data.archivedBy ||
                "system",

              archivedAt,

              deleteAt,

              createdAt:
                archivedAt,

            },
            {
              merge:
                true,
            }
          );


          indexed +=
            1;
        }
      }


      /* =========================
         RESULT
      ========================= */

      console.log(
        `Archive rebuild complete. ${indexed} records indexed.`
      );


      return {

        success:
          true,

        indexed,

      };
    }
  );
