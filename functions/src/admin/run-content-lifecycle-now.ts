import {
  onCall,
  HttpsError,
} from "firebase-functions/v2/https";


import {
  requireAdmin,
} from "../core/auth-helpers";


import {
  runContentLifecycle,
} from "./content-lifecycle";


export const runContentLifecycleNow =
    onCall(
      async (
        request
      ) => {
        /* =========================
           AUTHORIZATION
        ========================= */

        const admin =
          await requireAdmin(
            request
          );


        /*
          This manual lifecycle trigger
          is more powerful than normal
          admin moderation.

          Only superadmin should be
          allowed to run it.
        */

        if (
          admin.role !==
          "superadmin"
        ) {
          throw new HttpsError(
            "permission-denied",
            "Only a superadmin can manually run the content lifecycle."
          );
        }


        /* =========================
           RUN LIFECYCLE
        ========================= */

        console.log(
          "Manual content lifecycle started by:",
          admin.userId
        );


        await runContentLifecycle();


        console.log(
          "Manual content lifecycle completed by:",
          admin.userId
        );


        return {

          success:
            true,

          message:
            "Content lifecycle completed successfully.",

        };
      }
    );
