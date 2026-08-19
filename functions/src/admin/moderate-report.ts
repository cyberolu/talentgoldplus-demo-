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


const allowedActions = [
  "resolve",
  "dismiss",
  "hide_post",
  "restore_post",
  "accept_appeal",
  "reject_appeal",
];


export const moderateReport =
  onCall(async (request) => {
    /* =========================
       ADMIN CHECK
    ========================= */

    const admin =
      await requireAdmin(request);


    /* =========================
       INPUT
    ========================= */

    const reportId =
      request.data?.reportId;

    const action =
      request.data?.action;

    const note =
      request.data?.note;


    if (
      typeof reportId !== "string" ||
      !reportId.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid report ID is required."
      );
    }


    if (
      typeof action !== "string" ||
      !allowedActions.includes(action)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "This moderation action is not supported."
      );
    }


    const cleanNote =
      typeof note === "string" ?
        note.trim() :
        "";


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
        "Report not found."
      );
    }


    const reportData =
      reportSnapshot.data() ||
      {};


    const itemId =
      reportData.itemId ||
      "";


    const batch =
      db.batch();


    /* =========================
       RESOLVE
    ========================= */

    if (
      action === "resolve"
    ) {
      batch.update(
        reportReference,
        {

          status:
            "resolved",

          resolution:
            "reviewed",

          moderatorNote:
            cleanNote,

          resolvedAt:
            FieldValue.serverTimestamp(),

          resolvedBy:
            admin.userId,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );
    }


    /* =========================
       DISMISS
    ========================= */

    if (
      action === "dismiss"
    ) {
      batch.update(
        reportReference,
        {

          status:
            "dismissed",

          resolution:
            "no_action",

          moderatorNote:
            cleanNote,

          resolvedAt:
            FieldValue.serverTimestamp(),

          resolvedBy:
            admin.userId,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );
    }


    /* =========================
       HIDE POST
    ========================= */

    if (
      action === "hide_post"
    ) {
      if (
        typeof itemId !== "string" ||
        !itemId.trim()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This report does not contain a valid post ID."
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
          "Reported post no longer exists."
        );
      }


      const postData =
        postSnapshot.data() ||
        {};


      const postOwnerId =
        postData.userId ||
        "";


      batch.update(
        postReference,
        {

          hidden:
            true,

          hiddenAt:
            FieldValue.serverTimestamp(),

          hiddenBy:
            admin.userId,

          moderationReason:
            cleanNote ||
            reportData.reason ||
            "Reported content",

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      batch.update(
        reportReference,
        {

          status:
            "resolved",

          resolution:
            "post_hidden",

          moderatorNote:
            cleanNote,

          resolvedAt:
            FieldValue.serverTimestamp(),

          resolvedBy:
            admin.userId,

          appealStatus:
            "not_appealed",

          appealSubmittedAt:
            null,

          appealSubmittedBy:
            "",

          appealReason:
            "",

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      if (
        typeof postOwnerId === "string" &&
        postOwnerId.trim()
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
              postOwnerId,

            type:
              "content_hidden",

            title:
              "Your post has been hidden",

            message:
              `Your post has been hidden by TalentGoldPlus. Reason: ${
                cleanNote ||
                reportData.reason ||
                "Moderation review"
              }. You can appeal this decision.`,

            reportId,

            itemId,

            action:
              "hide_post",

            appealAvailable:
              true,

            read:
              false,

            createdAt:
              FieldValue.serverTimestamp(),

          }
        );
      }
    }


    /* =========================
       RESTORE POST
    ========================= */

    if (
      action === "restore_post"
    ) {
      if (
        typeof itemId !== "string" ||
        !itemId.trim()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This report does not contain a valid post ID."
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
          "Reported post no longer exists."
        );
      }


      const postData =
        postSnapshot.data() ||
        {};


      const postOwnerId =
        postData.userId ||
        "";


      batch.update(
        postReference,
        {

          hidden:
            false,

          restoredAt:
            FieldValue.serverTimestamp(),

          restoredBy:
            admin.userId,

          moderationReason:
            "",

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      batch.update(
        reportReference,
        {

          status:
            "resolved",

          resolution:
            "post_restored",

          moderatorNote:
            cleanNote,

          resolvedAt:
            FieldValue.serverTimestamp(),

          resolvedBy:
            admin.userId,

          appealStatus:
            reportData.appealStatus ===
              "pending" ?
              "accepted" :
              reportData.appealStatus ||
                "not_appealed",

          appealReviewedAt:
            FieldValue.serverTimestamp(),

          appealReviewedBy:
            admin.userId,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      if (
        typeof postOwnerId === "string" &&
        postOwnerId.trim()
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
              postOwnerId,

            type:
              "content_restored",

            title:
              "Your post has been restored",

            message:
              cleanNote ?
                `Your post has been restored by TalentGoldPlus. ${cleanNote}` :
                "Your post has been restored by TalentGoldPlus.",

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
      }
    }


    /* =========================
       ACCEPT APPEAL
    ========================= */

    if (
      action === "accept_appeal"
    ) {
      if (
        reportData.appealStatus !==
        "pending"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "There is no pending appeal for this report."
        );
      }


      if (
        typeof itemId !== "string" ||
        !itemId.trim()
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This appeal does not contain a valid post ID."
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


      const postOwnerId =
        postData.userId ||
        "";


      batch.update(
        postReference,
        {

          hidden:
            false,

          restoredAt:
            FieldValue.serverTimestamp(),

          restoredBy:
            admin.userId,

          moderationReason:
            "",

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      batch.update(
        reportReference,
        {

          status:
            "resolved",

          resolution:
            "appeal_accepted",

          appealStatus:
            "accepted",

          appealDecision:
            cleanNote,

          appealReviewedAt:
            FieldValue.serverTimestamp(),

          appealReviewedBy:
            admin.userId,

          moderatorNote:
            cleanNote,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      if (
        typeof postOwnerId === "string" &&
        postOwnerId.trim()
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
              postOwnerId,

            type:
              "appeal_accepted",

            title:
              "Your appeal was accepted",

            message:
              cleanNote ?
                `Your appeal has been accepted and your post has been restored. ${cleanNote}` :
                "Your appeal has been accepted and your post has been restored.",

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
      }
    }


    /* =========================
       REJECT / UPHOLD APPEAL
    ========================= */

    if (
      action === "reject_appeal"
    ) {
      if (
        reportData.appealStatus !==
        "pending"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "There is no pending appeal for this report."
        );
      }


      if (
        !cleanNote
      ) {
        throw new HttpsError(
          "invalid-argument",
          "A reason is required when upholding a moderation decision."
        );
      }


      let postOwnerId =
        "";


      if (
        typeof itemId === "string" &&
        itemId.trim()
      ) {
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
          postSnapshot.exists
        ) {
          const postData =
            postSnapshot.data() ||
            {};


          postOwnerId =
            postData.userId ||
            "";
        }
      }


      batch.update(
        reportReference,
        {

          status:
            "resolved",

          resolution:
            "appeal_rejected",

          appealStatus:
            "rejected",

          appealDecision:
            cleanNote,

          appealReviewedAt:
            FieldValue.serverTimestamp(),

          appealReviewedBy:
            admin.userId,

          moderatorNote:
            cleanNote,

          updatedAt:
            FieldValue.serverTimestamp(),

        }
      );


      if (
        typeof postOwnerId === "string" &&
        postOwnerId.trim()
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
              postOwnerId,

            type:
              "appeal_rejected",

            title:
              "Your appeal was reviewed",

            message:
              `Your appeal has been reviewed and the original moderation decision has been upheld. Reason: ${cleanNote}`,

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
      }
    }


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
          `report_${action}`,

        reportId,

        itemId,

        reportType:
          reportData.type ||
          "",

        moderatorNote:
          cleanNote,

        appealStatus:
          reportData.appealStatus ||
          "",

        performedBy:
          admin.userId,

        performedByRole:
          admin.role,

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

      reportId,

      action,

    };
  });
