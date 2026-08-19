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


export const submitAppeal =
    onCall(async (request) => {
      /* =========================
         AUTH
      ========================= */

      if (
        !request.auth
      ) {
        throw new HttpsError(
          "unauthenticated",
          "You must be signed in to submit an appeal."
        );
      }


      const userId =
        request.auth.uid;


      /* =========================
         INPUT
      ========================= */

      const reportId =
        request.data?.reportId;

      const reason =
        request.data?.reason;


      if (
        typeof reportId !== "string" ||
        !reportId.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A valid moderation case ID is required."
        );
      }


      if (
        typeof reason !== "string" ||
        !reason.trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "An appeal reason is required."
        );
      }


      const cleanReason =
        reason.trim();


      if (
        cleanReason.length <
        10
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Please provide more information about your appeal."
        );
      }


      /* =========================
         USER
      ========================= */

      const userReference =
        db
          .collection(
            "users"
          )
          .doc(
            userId
          );


      const userSnapshot =
        await userReference.get();


      if (
        !userSnapshot.exists
      ) {
        throw new HttpsError(
          "not-found",
          "Your TalentGoldPlus account could not be found."
        );
      }


      const userData =
        userSnapshot.data() ||
        {};


      if (
        userData.status !==
        "active"
      ) {
        throw new HttpsError(
          "permission-denied",
          "Only active accounts can submit moderation appeals."
        );
      }


      /* =========================
         REPORT
      ========================= */

      const reportReference =
        db
          .collection(
            "reports"
          )
          .doc(
            reportId
          );


      const reportSnapshot =
        await reportReference.get();


      if (
        !reportSnapshot.exists
      ) {
        throw new HttpsError(
          "not-found",
          "Moderation case not found."
        );
      }


      const reportData =
        reportSnapshot.data() ||
        {};


      if (
        reportData.resolution !==
        "post_hidden"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This moderation decision is not currently eligible for appeal."
        );
      }


      /* =========================
         EXISTING APPEAL
      ========================= */

      if (
        reportData.appealStatus ===
          "pending"
      ) {
        throw new HttpsError(
          "already-exists",
          "An appeal has already been submitted for this case."
        );
      }


      if (
        reportData.appealStatus ===
          "accepted"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This appeal has already been accepted."
        );
      }


      /* =========================
         CONTENT
      ========================= */

      const itemId =
        reportData.itemId;


      if (
        typeof itemId !== "string" ||
        !itemId.trim()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "The moderated content could not be identified."
        );
      }


      const postReference =
        db
          .collection(
            "communityPosts"
          )
          .doc(
            itemId
          );


      const postSnapshot =
        await postReference.get();


      if (
        !postSnapshot.exists
      ) {
        throw new HttpsError(
          "not-found",
          "The moderated post no longer exists."
        );
      }


      const postData =
        postSnapshot.data() ||
        {};


      /* =========================
         OWNERSHIP CHECK
      ========================= */

      if (
        postData.userId !==
        userId
      ) {
        throw new HttpsError(
          "permission-denied",
          "You can only appeal moderation decisions made against your own content."
        );
      }


      /* =========================
         APPEAL
      ========================= */

      const batch =
        db.batch();


      batch.update(
        reportReference,
        {

          status:
            "appealed",

          appealStatus:
            "pending",

          appealReason:
            cleanReason,

          appealSubmittedBy:
            userId,

          appealSubmittedAt:
            FieldValue.serverTimestamp(),

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
            "moderation_appeal_submitted",

          reportId,

          itemId,

          submittedBy:
            userId,

          createdAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         ADMIN NOTIFICATION RECORD
      ========================= */

      const moderationNotificationReference =
        db
          .collection(
            "moderationNotifications"
          )
          .doc();


      batch.set(
        moderationNotificationReference,
        {

          type:
            "appeal_submitted",

          reportId,

          itemId,

          userId,

          userName:
            userData.name ||
            userData.fullName ||
            "TalentGoldPlus User",

          message:
            "A moderation appeal has been submitted.",

          read:
            false,

          createdAt:
            FieldValue.serverTimestamp(),

        }
      );


      /* =========================
         USER CONFIRMATION
      ========================= */

      const userNotificationReference =
        db
          .collection(
            "notifications"
          )
          .doc();


      batch.set(
        userNotificationReference,
        {

          userId,

          type:
            "appeal_submitted",

          title:
            "Appeal submitted",

          message:
            "Your moderation appeal has been submitted and will be reviewed by TalentGoldPlus.",

          reportId,

          itemId,

          appealAvailable:
            false,

          read:
            false,

          createdAt:
            FieldValue.serverTimestamp(),

        }
      );


      await batch.commit();


      return {

        success:
          true,

        reportId,

        appealStatus:
          "pending",

      };
    });
