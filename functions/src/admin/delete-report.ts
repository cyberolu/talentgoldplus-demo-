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


export const deleteReport =
    onCall(async (request) => {
      const admin =
        await requireAdmin(request);


      if (
        admin.role !== "superadmin"
      ) {
        throw new HttpsError(
          "permission-denied",
          "Only a superadmin can permanently delete reports."
        );
      }


      const reportId =
        request.data?.reportId;


      if (
        typeof reportId !== "string" ||
        !reportId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid report ID is required."
        );
      }


      const reportReference =
        db
          .collection("reports")
          .doc(reportId);


      const reportSnapshot =
        await reportReference.get();


      if (
        !reportSnapshot.exists
      ) {
        throw new HttpsError(
          "not-found",
          "Report not found."
        );
      }


      const reportData =
        reportSnapshot.data() || {};


      const batch =
        db.batch();


      batch.delete(
        reportReference
      );


      const auditReference =
        db
          .collection("auditLogs")
          .doc();


      batch.set(
        auditReference,
        {
          action:
            "report_permanently_deleted",

          reportId,

          reportType:
            reportData.type || "",

          itemId:
            reportData.itemId || "",

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

        reportId,
      };
    });
