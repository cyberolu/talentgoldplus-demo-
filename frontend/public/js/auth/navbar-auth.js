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

  if (isLoggedIn) {
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

function showLoggedInNavigation(
  authNavItem,
  notificationsNavItem,
  userData
) {
  if (notificationsNavItem) {
    notificationsNavItem.style.display =
      "block";
  }

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

  const avatar = profileImage
    ? `
      <img
        src="${profileImage}"
        alt="${name}"
        class="nav-user-avatar"
      >
    `
    : `
      <span class="nav-user-initials">
        ${getInitials(name)}
      </span>
    `;

  if (authNavItem) {
    authNavItem.innerHTML = `
      <div class="nav-user-menu">
        <button
          class="nav-user-toggle"
          id="navUserToggle"
          type="button"
        >
          ${avatar}

          <span class="nav-user-name">
            ${name}
          </span>

          <span class="nav-user-arrow">
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

  document
    .querySelectorAll("#joinBtn")
    .forEach((button) => {
      button.style.display = "none";
    });
}

function showLoggedOutNavigation(
  authNavItem,
  notificationsNavItem
) {
  if (notificationsNavItem) {
    notificationsNavItem.style.display =
      "none";
  }

  if (authNavItem) {
    authNavItem.innerHTML = `
      <a href="${loginPath}">
        Login
      </a>
    `;
  }

  document
    .querySelectorAll("#joinBtn")
    .forEach((button) => {
      button.style.display =
        "inline-block";
    });
}

function setupUserDropdown() {
  const toggle =
    document.getElementById(
      "navUserToggle"
    );

  const dropdown =
    document.getElementById(
      "navUserDropdown"
    );

  if (!toggle || !dropdown) {
    return;
  }

  toggle.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      dropdown.classList.toggle(
        "active"
      );
    }
  );

  document.addEventListener(
    "click",
    () => {
      dropdown.classList.remove(
        "active"
      );
    }
  );
}