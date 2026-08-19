import {
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";

import {
  db,
} from "./firebase-admin";

export async function requireSignedIn(
  request: CallableRequest
) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  return request.auth.uid;
}

export async function requireAdmin(
  request: CallableRequest
) {
  const userId =
      await requireSignedIn(request);

  const userSnapshot =
      await db
        .collection("users")
        .doc(userId)
        .get();

  if (!userSnapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "User profile not found."
    );
  }

  const role =
      userSnapshot.data()?.role;

  if (
    role !== "admin" &&
      role !== "superadmin"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Admin access required."
    );
  }

  return {
    userId,
    role,
  };
}
