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


export const setUserStatus =
  onCall(async (request) => {
    const admin =
      await requireAdmin(request);


    /* =========================
       INPUT
    ========================= */

    const userId =
      request.data?.userId;

    const status =
      request.data?.status;

    const reason =
      request.data?.reason;


    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid user ID is required."
      );
    }


    if (
      status !== "active" &&
      status !== "suspended"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Status must be active or suspended."
      );
    }


    /* =========================
       SELF PROTECTION
    ========================= */

    if (
      userId === admin.userId
    ) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot change the status of your own account."
      );
    }


    /* =========================
       TARGET USER
    ========================= */

    const targetUserRef =
      db
        .collection("users")
        .doc(userId);


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
      targetUser.role ||
      "athlete";


    /* =========================
       SUPERADMIN PROTECTION
    ========================= */

    /*
      No admin or superadmin may
      suspend/reactivate a superadmin
      through this function.

      This prevents accidental or
      malicious lockout of the highest
      privilege account.
    */

    if (
      targetRole === "superadmin"
    ) {
      throw new HttpsError(
        "permission-denied",
        "Superadmin accounts are protected and cannot be suspended or reactivated here."
      );
    }


    /* =========================
       ADMIN PROTECTION
    ========================= */

    /*
      Normal admins cannot change
      another admin's status.

      Only a superadmin may suspend
      or reactivate an admin.
    */

    if (
      targetRole === "admin" &&
      admin.role !== "superadmin"
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only a superadmin can change the status of an admin."
      );
    }


    /* =========================
       SUSPENSION REASON
    ========================= */

    if (
      status === "suspended" &&
      (
        typeof reason !== "string" ||
        !reason.trim()
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A suspension reason is required."
      );
    }


    const cleanReason =
      status === "suspended" ?
        reason.trim() :
        "";


    /* =========================
       FIRESTORE BATCH
    ========================= */

    const batch =
      db.batch();


    batch.update(
      targetUserRef,
      {
        status,

        suspensionReason:
          cleanReason,

        statusUpdatedAt:
          FieldValue.serverTimestamp(),

        statusUpdatedBy:
          admin.userId,
      }
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
          status === "suspended" ?
            "user_suspended" :
            "user_reactivated",

        userId,

        targetRole,

        reason:
          cleanReason,

        performedBy:
          admin.userId,

        performedByRole:
          admin.role,

        createdAt:
          FieldValue.serverTimestamp(),
      }
    );


    /* =========================
       NOTIFICATION
    ========================= */

    const notificationRef =
      db
        .collection("notifications")
        .doc();


    batch.set(
      notificationRef,
      {
        userId,

        type:
          status === "suspended" ?
            "account_suspended" :
            "account_reactivated",

        title:
          status === "suspended" ?
            "Account suspended" :
            "Account reactivated",

        message:
          status === "suspended" ?
            "Your TalentGoldPlus account has been suspended." :
            "Your TalentGoldPlus account has been reactivated.",

        reason:
          cleanReason,

        read:
          false,

        createdAt:
          FieldValue.serverTimestamp(),
      }
    );


    await batch.commit();


    /* =========================
       FIREBASE AUTH
    ========================= */

    try {
      await adminAuth.updateUser(
        userId,
        {
          disabled:
            status === "suspended",
        }
      );
    } catch (error) {
      console.error(
        "Auth account status update failed:",
        error
      );

      /*
        Firestore status still protects
        application access even if the
        Auth emulator/Admin SDK call fails.
      */
    }


    return {
      success: true,
      userId,
      status,
    };
  });
