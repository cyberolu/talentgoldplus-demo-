import {
  auth,
  db
} from "../firebase.js";

import {
  createUserWithEmailAndPassword,
  deleteUser
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const registerForm =
  document.getElementById(
    "registerForm"
  );

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    handleRegistration
  );

}

async function handleRegistration(
  event
) {

  event.preventDefault();

  const name =
    document
      .getElementById("name")
      ?.value
      .trim();

  const email =
    document
      .getElementById("email")
      ?.value
      .trim();

  const password =
    document
      .getElementById("password")
      ?.value;

  const role =
    document
      .getElementById("role")
      ?.value;

  const category =
    document
      .getElementById("category")
      ?.value;

  if (
    !name ||
    !email ||
    !password ||
    !role ||
    !category
  ) {

    alert(
      "Please complete all fields."
    );

    return;
  }

  if (
    password.length < 8
  ) {

    alert(
      "Your password must contain at least 8 characters."
    );

    return;
  }

  const allowedRoles = [
    "athlete",
    "coach",
    "professional",
    "scout",
    "investor",
    "partner",
    "volunteer"
  ];

  if (
    !allowedRoles.includes(
      role
    )
  ) {

    alert(
      "Please select a valid role."
    );

    return;
  }

  const submitButton =
    registerForm.querySelector(
      'button[type="submit"]'
    );

  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Creating Account...";

  }

  let createdUser =
    null;

  try {

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    createdUser =
      userCredential.user;

    await setDoc(
      doc(
        db,
        "users",
        createdUser.uid
      ),
      {
        uid:
          createdUser.uid,

        name,

        email,

        role,

        category,

        status:
          "pending",

        approvalStatus:
          "pending",

        profileCompleted:
          false,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

    window.location.href =
      "../pages/account-pending.html";

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    if (createdUser) {

      try {

        await deleteUser(
          createdUser
        );

      } catch (
        deleteError
      ) {

        console.error(
          "Could not remove incomplete account:",
          deleteError
        );

      }

    }

    showRegistrationError(
      error
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Create Account";

    }

  }

}


function showRegistrationError(
  error
) {

  switch (
    error.code
  ) {

    case "auth/email-already-in-use":

      alert(
        "An account already exists with this email address."
      );

      break;


    case "auth/invalid-email":

      alert(
        "Please enter a valid email address."
      );

      break;


    case "auth/weak-password":

      alert(
        "Please choose a stronger password."
      );

      break;


    case "auth/network-request-failed":

      alert(
        "There was a network problem. Please check your connection and try again."
      );

      break;


    default:

      alert(
        "We could not create your account. Please try again."
      );

  }

}