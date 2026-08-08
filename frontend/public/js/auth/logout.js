import {
  auth
} from "../firebase.js";

import {
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  homePath
} from "./auth-paths.js";

export function setupLogoutButton(
  buttonId
) {
  const button =
    document.getElementById(buttonId);

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();

      try {
        await signOut(auth);

        window.location.href =
          homePath;

      } catch (error) {
        console.error(
          "Logout error:",
          error
        );

        alert(
          "We could not log you out. Please try again."
        );
      }
    }
  );
}

export function initialiseLogoutButtons() {
  setupLogoutButton("logoutBtn");
  setupLogoutButton(
    "mobileLogoutBtn"
  );
}