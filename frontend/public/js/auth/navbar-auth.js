import {
  getInitials
} from "../utils/user-helpers.js";

import {
  setupLogoutButton
} from "./logout.js";

import {
  loginPath,
  dashboardPath,
  profileSetupPath,
  messagesPath,
  notificationsPath
} from "./auth-paths.js";


export function updatePublicNavbar(
  isLoggedIn,
  userData = null
) {

  const authNavItem =
    document.getElementById(
      "authNavItem"
    );

  const notificationsNavItem =
    document.getElementById(
      "notificationsNavItem"
    );


  if (
    isLoggedIn
  ) {

    showLoggedInNavigation(
      authNavItem,
      notificationsNavItem,
      userData
    );

    return;

  }


  showLoggedOutNavigation(
    authNavItem,
    notificationsNavItem
  );

}


/* =========================================================
   LOGGED IN NAVIGATION
========================================================= */

function showLoggedInNavigation(
  authNavItem,
  notificationsNavItem,
  userData
) {

  /* =========================
     SHOW NOTIFICATIONS
  ========================= */

  if (
    notificationsNavItem
  ) {

    notificationsNavItem.hidden =
      false;

  }


  /* =========================
     USER DETAILS
  ========================= */

  const name =
    userData?.fullName ||
    userData?.name ||
    "User";


  const profileImage =
    userData?.profileImage &&
    userData.profileImage.startsWith(
      "http"
    )
      ? userData.profileImage
      : "";


  const avatar =
    profileImage
      ? `
        <img
          src="${profileImage}"
          alt="${escapeHtml(name)}"
          class="nav-user-avatar"
        >
      `
      : `
        <span
          class="nav-user-initials"
        >
          ${escapeHtml(
            getInitials(name)
          )}
        </span>
      `;


  /* =========================
     USER MENU
  ========================= */

  if (
    authNavItem
  ) {

    authNavItem.innerHTML = `

      <div class="nav-user-menu">


        <button
          class="nav-user-toggle"
          id="navUserToggle"
          type="button"
          aria-expanded="false"
          aria-controls="navUserDropdown"
        >

          ${avatar}


          <span class="nav-user-name">

            ${escapeHtml(name)}

          </span>


          <span
            class="nav-user-arrow"
            aria-hidden="true"
          >
            ▼
          </span>

        </button>


        <div
          class="nav-user-dropdown"
          id="navUserDropdown"
        >

          <a href="${dashboardPath}">
            Dashboard
          </a>


          <a href="${profileSetupPath}">
            My Profile
          </a>


          <a href="${messagesPath}">
            Messages
          </a>


          <a href="${notificationsPath}">
            Notifications
          </a>


          <button
            id="publicLogoutBtn"
            type="button"
          >
            Logout
          </button>

        </div>


      </div>

    `;


    setupLogoutButton(
      "publicLogoutBtn"
    );


    setupUserDropdown();

  }


  /* =========================
     HIDE JOIN BUTTON
  ========================= */

  document
    .querySelectorAll(
      "#joinBtn"
    )
    .forEach(
      (button) => {

        button.hidden =
          true;

      }
    );

}


/* =========================================================
   LOGGED OUT NAVIGATION
========================================================= */

function showLoggedOutNavigation(
  authNavItem,
  notificationsNavItem
) {

  /* =========================
     HIDE NOTIFICATIONS
  ========================= */

  if (
    notificationsNavItem
  ) {

    notificationsNavItem.hidden =
      true;

  }


  /* =========================
     LOGIN LINK
  ========================= */

  if (
    authNavItem
  ) {

    authNavItem.innerHTML = `
      <a href="${loginPath}">
        Login
      </a>
    `;

  }


  /* =========================
     SHOW JOIN BUTTON
  ========================= */

  document
    .querySelectorAll(
      "#joinBtn"
    )
    .forEach(
      (button) => {

        button.hidden =
          false;

      }
    );

}


/* =========================================================
   USER DROPDOWN
========================================================= */

function setupUserDropdown() {

  const toggle =
    document.getElementById(
      "navUserToggle"
    );


  const dropdown =
    document.getElementById(
      "navUserDropdown"
    );


  if (
    !toggle ||
    !dropdown
  ) {

    return;

  }


  toggle.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();


      const isOpen =
        dropdown.classList.toggle(
          "active"
        );


      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    }
  );


  dropdown.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

    }
  );


  document.addEventListener(
    "click",
    () => {

      dropdown.classList.remove(
        "active"
      );


      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      dropdown.classList.remove(
        "active"
      );


      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

    }
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value = ""
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      "\"",
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}