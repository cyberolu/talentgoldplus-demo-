import {
  auth,
  db
} from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  loginPath
} from "./auth-paths.js";

import {
  updatePublicNavbar
} from "./navbar-auth.js";

import {
  initialiseLogoutButtons
} from "./logout.js";

import {
  renderDashboard
} from "../dashboard/dashboard.js";

import {
  listenForNotifications
} from "../notifications/notification-listener.js";

const protectedPages = [
  "dashboard.html",
  "profile-setup.html",
  "community.html",
  "connections.html",
  "messages.html",
  "notifications.html",
  "create-listing.html"
];

const currentPath =
  window.location.pathname;

const isProtectedPage =
  protectedPages.some((page) =>
    currentPath.includes(page)
  );

const isDashboardPage =
  currentPath.includes(
    "dashboard.html"
  );

initialiseLogoutButtons();

onAuthStateChanged(
  auth,
  handleAuthenticationState
);

async function handleAuthenticationState(
  user
) {
  await waitForHeaderIfRequired();

  if (!user) {
    handleLoggedOutUser();
    return;
  }

  try {
    const userReference =
      doc(db, "users", user.uid);

    const userSnapshot =
      await getDoc(userReference);

    if (!userSnapshot.exists()) {
      console.error(
        "User document does not exist."
      );

      await signOut(auth);

      window.location.href =
        loginPath;

      return;
    }

    const userData =
      userSnapshot.data();

    const accountIsAvailable =
      await checkAccountStatus(
        userData
      );

    if (!accountIsAvailable) {
      return;
    }

    updatePublicNavbar(
      true,
      userData
    );

    listenForNotifications(
      user.uid
    );

    if (isDashboardPage) {
      renderDashboard(userData);
    }

    document.body.style.display =
      "block";

  } catch (error) {
    console.error(
      "Authentication state error:",
      error
    );

    document.body.style.display =
      "block";
  }
}

function handleLoggedOutUser() {
  if (isProtectedPage) {
    window.location.href =
      loginPath;

    return;
  }

  updatePublicNavbar(false);

  document.body.style.display =
    "block";
}

async function checkAccountStatus(
  userData
) {
  const accountStatus =
    (
      userData.status || "active"
    ).toLowerCase();

  if (accountStatus === "active") {
    return true;
  }

  const messages = {
    pending:
      "Your account is awaiting approval. Please check back later.",

    "under-review":
      "Your account is currently under review. Please contact TalentGoldPlus if you require further information.",

    suspended:
      "Your account has been suspended. Please contact TalentGoldPlus support if you believe this is an error.",

    banned:
      "Your account has been permanently restricted from using TalentGoldPlus."
  };

  alert(
    messages[accountStatus] ||
    "Your TalentGoldPlus account is currently unavailable."
  );

  await signOut(auth);

  window.location.href =
    loginPath;

  return false;
}

function waitForHeaderIfRequired() {
  return new Promise((resolve) => {
    const siteHeader =
      document.getElementById(
        "siteHeader"
      );

    if (!siteHeader) {
      resolve();
      return;
    }

    if (
      document.getElementById(
        "authNavItem"
      )
    ) {
      resolve();
      return;
    }

    document.addEventListener(
      "siteHeaderLoaded",
      resolve,
      {
        once: true
      }
    );
  });
}