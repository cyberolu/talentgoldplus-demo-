import { auth } from "./firebase.js";

import {
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const forgotPasswordForm =
  document.getElementById("forgotPasswordForm");

const resetMessage =
  document.getElementById("resetMessage");

if (forgotPasswordForm) {

  forgotPasswordForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
      document.getElementById("resetEmail").value.trim();

    if (!email) {

      resetMessage.textContent =
        "Please enter your email address.";

      return;

    }

    try {

      await sendPasswordResetEmail(auth, email);

      resetMessage.innerHTML = `
        <p style="color: green; font-weight: 700;">
          Password reset email sent.
        </p>

        <p>
          Please check your Inbox and Spam/Junk folder.
        </p>
      `;

    } catch (error) {

      resetMessage.innerHTML = `
        <p style="color: red; font-weight: 700;">
          ${error.message}
        </p>
      `;

    }

  });

}