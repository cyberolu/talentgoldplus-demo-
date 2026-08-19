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


const allowedRoles = [
  "athlete",
  "coach",
  "professional",
  "scout",
  "moderator",
  "admin",
  "superadmin",
];


const adminAssignableRoles = [
  "athlete",
  "coach",
  "professional",
  "scout",
  "moderator",
];


const professionalCategories = [
  "coach",
  "physiotherapist",
  "sports-therapist",
  "nutritionist",
  "psychologist",
  "wellbeing-specialist",
  "recovery-expert",
  "mentor",
  "performance-specialist",
];


export const setUserRole =
  onCall(async (request) => {
    const actingAdmin =
      await requireAdmin(request);


    const userId =
      request.data?.userId;

    const requestedRole =
      request.data?.role;


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
      typeof requestedRole !== "string" ||
      !requestedRole.trim()
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A valid role is required."
      );
    }


    if (
      userId === actingAdmin.userId
    ) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot change your own role."
      );
    }


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


    const currentRole =
      targetUser.role ||
      "athlete";


    /* =========================
       PROTECT SUPERADMIN
    ========================= */

    if (
      currentRole === "superadmin"
    ) {
      throw new HttpsError(
        "permission-denied",
        "Superadmin accounts are protected and cannot have their role changed."
      );
    }


    /* =========================
       PROTECT ADMIN ACCOUNTS
    ========================= */

    if (
      currentRole === "admin" &&
      actingAdmin.role !== "superadmin"
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only a superadmin can change the role of an admin."
      );
    }


    let role =
      requestedRole;

    let professionalCategory =
      "";


    if (
      professionalCategories.includes(
        requestedRole
      )
    ) {
      role =
        "professional";

      professionalCategory =
        requestedRole;
    } else if (
      !allowedRoles.includes(
        requestedRole
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "This role is not allowed."
      );
    }


    /* =========================
       ADMIN PERMISSIONS
    ========================= */

    if (
      actingAdmin.role === "admin"
    ) {
      /*
        Admins may manage ordinary roles,
        but cannot create privileged accounts.
      */

      if (
        !adminAssignableRoles.includes(
          role
        )
      ) {
        throw new HttpsError(
          "permission-denied",
          "Admins cannot assign admin or superadmin roles."
        );
      }
    }


    /* =========================
       SUPERADMIN PERMISSIONS
    ========================= */

    if (
      actingAdmin.role === "superadmin"
    ) {
      /*
        Superadmins may promote users
        to admin or superadmin.

        Existing superadmin accounts
        remain protected above.
      */

      if (
        !allowedRoles.includes(
          role
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "This role is not allowed."
        );
      }
    }


    const updateData = {

      role,

      professionalCategory,

      roleUpdatedAt:
        FieldValue.serverTimestamp(),

      roleUpdatedBy:
        actingAdmin.userId,

      ...(professionalCategory ?
        {
          sport: "",
          category: "",
          pbs: "",
          achievements: "",
        } :
        {}),

    };


    const batch =
      db.batch();


    batch.update(
      targetUserRef,
      updateData
    );


    const auditRef =
      db
        .collection("auditLogs")
        .doc();


    batch.set(
      auditRef,
      {

        action:
          "user_role_changed",

        userId,

        previousRole:
          currentRole,

        newRole:
          role,

        professionalCategory,

        performedBy:
          actingAdmin.userId,

        performedByRole:
          actingAdmin.role,

        createdAt:
          FieldValue.serverTimestamp(),

      }
    );


    const notificationRef =
      db
        .collection("notifications")
        .doc();


    batch.set(
      notificationRef,
      {

        userId,

        type:
          "user_role_changed",

        title:
          "Account role updated",

        message:
          professionalCategory ?
            `Your TalentGoldPlus role has been updated to ${professionalCategory}.` :
            `Your TalentGoldPlus role has been updated to ${role}.`,

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

      userId,

      previousRole:
        currentRole,

      role,

      professionalCategory,

    };
  });
