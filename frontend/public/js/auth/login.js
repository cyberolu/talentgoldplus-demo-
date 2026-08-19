import {
  auth,
  db
} from "../firebase.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const loginForm =
  document.getElementById(
    "loginForm"
  );

const forgotPasswordLink =
  document.getElementById(
    "forgotPasswordLink"
  );

const googleLoginBtn =
  document.getElementById(
    "googleLoginBtn"
  );


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    handleLogin
  );

}


if (forgotPasswordLink) {

  forgotPasswordLink.addEventListener(
    "click",
    handlePasswordReset
  );

}


if (googleLoginBtn) {

  googleLoginBtn.addEventListener(
    "click",
    handleGoogleLogin
  );

}


async function handleLogin(
  event
) {

  event.preventDefault();

  const email =
    document
      .getElementById("email")
      ?.value
      .trim();

  const password =
    document
      .getElementById("password")
      ?.value;

  if (
    !email ||
    !password
  ) {

    alert(
      "Please enter your email address and password."
    );

    return;
  }

  const submitButton =
    loginForm.querySelector(
      'button[type="submit"]'
    );

  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Logging In...";

  }

  try {

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    await routeAuthenticatedUser(
      credential.user
    );

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    showLoginError(
      error
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Login";

    }

  }

}


async function handlePasswordReset(
  event
) {

  event.preventDefault();

  const email =
    document
      .getElementById("email")
      ?.value
      .trim();

  if (!email) {

    alert(
      "Please enter your email address first."
    );

    return;
  }

  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

    alert(
      "Password reset email sent. Please check your inbox and spam folder."
    );

  } catch (error) {

    console.error(
      "Password reset error:",
      error
    );

    alert(
      "We could not send the password reset email. Please check the email address and try again."
    );

  }

}


async function handleGoogleLogin() {

  try {

    const provider =
      new GoogleAuthProvider();

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    const user =
      result.user;

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const userSnapshot =
      await getDoc(
        userRef
      );

    if (
      !userSnapshot.exists()
    ) {

      await setDoc(
        userRef,
        {
          uid:
            user.uid,

          name:
            user.displayName ||
            "User",

          email:
            user.email ||
            "",

          role:
            "athlete",

          category:
            "",

          profileImage:
            user.photoURL ||
            "",

          status:
            "pending",

          approvalStatus:
            "pending",

          profileCompleted:
            false,

          registrationMethod:
            "google",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

    }

    await routeAuthenticatedUser(
      user
    );

  } catch (error) {

    console.error(
      "Google login error:",
      error
    );

    alert(
      "Google login was unsuccessful. Please try again."
    );

  }

}


async function routeAuthenticatedUser(
  user
) {

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );

  const userSnapshot =
    await getDoc(
      userRef
    );

  if (
    !userSnapshot.exists()
  ) {

    alert(
      "Your TalentGoldPlus account could not be found."
    );

    return;
  }

  const userData =
    userSnapshot.data();

  const status =
    (
      userData.status ||
      "active"
    ).toLowerCase();

  if (
    status === "pending" ||
    status === "under-review"
  ) {

    window.location.href =
      "../pages/account-pending.html";

    return;
  }

  if (
    status === "rejected"
  ) {

    window.location.href =
      "../pages/account-pending.html?status=rejected";

    return;
  }

  if (
    status === "suspended" ||
    status === "banned"
  ) {

    alert(
      "Your TalentGoldPlus account is currently unavailable."
    );

    return;
  }

  window.location.href =
    "../pages/dashboard.html";

}


function showLoginError(
  error
) {

  switch (
    error.code
  ) {

    case "auth/invalid-credential":

      alert(
        "The email address or password is incorrect."
      );

      break;


    case "auth/invalid-email":

      alert(
        "Please enter a valid email address."
      );

      break;


    case "auth/too-many-requests":

      alert(
        "Too many unsuccessful attempts. Please wait before trying again."
      );

      break;


    case "auth/network-request-failed":

      alert(
        "There was a network problem. Please check your connection."
      );

      break;


    default:

      alert(
        "We could not log you in. Please try again."
      );

  }

}