import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";

import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  db,
  adminAuth,
} from "../core/firebase-admin";

import {
  requireAdmin,
} from "../core/auth-helpers";


export const deleteUser =
  onCall(async (request) => {
    const admin =
      await requireAdmin(request);


    /* =========================
       SUPERADMIN ONLY
    ========================= */

    if (
      admin.role !== "superadmin"
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only a superadmin can permanently delete a user."
      );
    }


    /* =========================
       INPUT
    ========================= */

    const userId =
      request.data?.userId;


    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid user ID is required."
      );
    }


    const cleanUserId =
      userId.trim();


    /* =========================
       SELF PROTECTION
    ========================= */

    if (
      cleanUserId === admin.userId
    ) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot delete your own account."
      );
    }


    /* =========================
       TARGET USER
    ========================= */

    const targetUserRef =
      db
        .collection("users")
        .doc(cleanUserId);


    const targetSnapshot =
      await targetUserRef.get();


    if (
      !targetSnapshot.exists
    ) {
      throw new HttpsError(
        "not-found",
        "User not found."
      );
    }


    const targetUser =
      targetSnapshot.data() || {};


    const targetRole =
      String(
        targetUser.role ||
        "athlete"
      ).toLowerCase();


    /* =========================
       SUPERADMIN PROTECTION
    ========================= */

    if (
      targetRole === "superadmin"
    ) {
      throw new HttpsError(
        "permission-denied",
        "Superadmin accounts are protected and cannot be deleted."
      );
    }


    /* =========================
       PRESERVE AUDIT DETAILS
    ========================= */

    const targetEmail =
      typeof targetUser.email === "string" ?
        targetUser.email :
        "";

    const targetName =
      typeof targetUser.fullName === "string" ?
        targetUser.fullName :
        (
          typeof targetUser.name === "string" ?
            targetUser.name :
            ""
        );


    /* =========================
       DELETE AUTH ACCOUNT
    ========================= */

    try {
      await adminAuth.deleteUser(
        cleanUserId
      );
    } catch (error: any) {
      /*
        If the Firestore user exists but
        the Firebase Auth account no
        longer exists, allow cleanup to
        continue.

        Any other Auth failure stops the
        deletion.
      */

      if (
        error?.code !==
        "auth/user-not-found"
      ) {
        console.error(
          "Firebase Auth user deletion failed:",
          error
        );

        throw new HttpsError(
          "internal",
          "The Firebase Authentication account could not be deleted."
        );
      }
    }


    /* =========================
       FIRESTORE CLEANUP
    ========================= */

    const batch =
      db.batch();


    /*
      Delete the primary user record.

      We deliberately do NOT blindly
      delete every document belonging
      to this UID here.

      Other collections may contain
      platform history, transactions,
      moderation records, messages,
      fundraising records, etc.

      Those need individual retention
      rules rather than uncontrolled
      cascading deletion.
    */

    batch.delete(
      targetUserRef
    );


    /* =========================
       AUDIT LOG
    ========================= */

    const auditRef =
      db
        .collection("auditLogs")
        .doc();


    batch.set(
      auditRef,
      {
        action:
          "user_deleted",

        userId:
          cleanUserId,

        targetRole,

        targetEmail,

        targetName,

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
      success: true,
      userId:
        cleanUserId,
    };
  });