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


export const deleteArchivedContent =
    onCall(
      async (
        request
      ) => {
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
            "Only a superadmin can permanently delete archived content."
          );
        }


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


        const collectionName =
          archiveData.collectionName;


        const itemId =
          archiveData.itemId;


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


        const batch =
          db.batch();


        batch.delete(
          itemReference
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
              "archived_content_permanently_deleted",

            itemId,

            collectionName,

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
