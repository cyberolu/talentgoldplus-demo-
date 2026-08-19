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


export const restoreArchivedContent =
    onCall(
      async (
        request
      ) => {
        const admin =
          await requireAdmin(
            request
          );


        const recordId =
          request.data?.recordId;


        if (
          typeof recordId !==
            "string" ||
          !recordId.trim()
        ) {
          throw new HttpsError(
            "invalid-argument",
            "A valid archive record ID is required."
          );
        }


        const archiveReference =
          db
            .collection(
              "archiveRecords"
            )
            .doc(
              recordId
            );


        const archiveSnapshot =
          await archiveReference.get();


        if (
          !archiveSnapshot.exists
        ) {
          throw new HttpsError(
            "not-found",
            "Archive record not found."
          );
        }


        const archiveData =
          archiveSnapshot.data() ||
          {};


        if (
          archiveData.archiveReason !==
          "manual_admin_archive"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Expired content cannot be restored without updating its expiry date."
          );
        }


        const collectionName =
          archiveData.collectionName;


        const itemId =
          archiveData.itemId;


        const previousStatus =
          archiveData.previousStatus;


        if (
          typeof collectionName !==
            "string" ||
          typeof itemId !==
            "string"
        ) {
          throw new HttpsError(
            "failed-precondition",
            "Archive record is incomplete."
          );
        }


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
            "Original content no longer exists."
          );
        }


        const batch =
          db.batch();


        batch.update(
          itemReference,
          {

            status:
              previousStatus,

            archivedAt:
              FieldValue.delete(),

            archivedBy:
              FieldValue.delete(),

            archiveReason:
              FieldValue.delete(),

            deleteAt:
              FieldValue.delete(),

            updatedAt:
              FieldValue.serverTimestamp(),

          }
        );


        batch.delete(
          archiveReference
        );


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
              "archived_content_restored",

            itemId,

            collectionName,

            restoredStatus:
              previousStatus,

            performedBy:
              admin.userId,

            performedByRole:
              admin.role,

            createdAt:
              FieldValue.serverTimestamp(),

          }
        );


        await batch.commit();


        return {

          success:
            true,

        };
      }
    );
