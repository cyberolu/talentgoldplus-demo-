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


/* =========================
   PROTECTED PAGES
========================= */

const protectedPages = [
  "dashboard.html",

  "profile.html",
  "profile-setup.html",

  "media.html",

  "community.html",

  "connections.html",

  "messages.html",

  "notifications.html",

  "my-submissions.html",

  "create-listing.html",

  "create-opportunity.html",

  "create-fundraiser.html",

  "create-event.html"
];

const currentPath =
  window.location.pathname;

const isProtectedPage =
  protectedPages.some(
    (page) =>
      currentPath.includes(page)
  );

const isDashboardPage =
  currentPath.includes(
    "dashboard.html"
  );

const isPendingPage =
  currentPath.includes(
    "account-pending.html"
  );


/* =========================
   INITIALISE
========================= */

initialiseLogoutButtons();

onAuthStateChanged(
  auth,
  handleAuthenticationState
);


/* =========================
   AUTH STATE
========================= */

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
      doc(
        db,
        "users",
        user.uid
      );

    const userSnapshot =
      await getDoc(
        userReference
      );

    if (!userSnapshot.exists()) {

      console.error(
        "User document does not exist."
      );

      await signOut(
        auth
      );

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

    if (isDashboardPage) {

      console.log(
        "AUTH DEBUG - rendering dashboard",
        {
          uid: user.uid,
          role: userData.role,
          name: userData.fullName,
          path: window.location.pathname
        }
      );
    
      renderDashboard(
        userData
      );
    
    }
    
    
    /*
      Public navbar is not essential to
      dashboard rendering, so an error here
      must not stop the member dashboard.
    */
    try {
    
      updatePublicNavbar(
        true,
        userData
      );
    
    } catch (navbarError) {
    
      console.error(
        "Navbar update error:",
        navbarError
      );
    
    }
    
    
    /*
      Notification listening is also
      non-critical to rendering the page.
    */
    try {
    
      listenForNotifications(
        user.uid
      );
    
    } catch (notificationError) {
    
      console.error(
        "Notification listener error:",
        notificationError
      );
    
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


/* =========================
   LOGGED OUT
========================= */

function handleLoggedOutUser() {

  if (isProtectedPage) {

    window.location.href =
      loginPath;

    return;

  }

  updatePublicNavbar(
    false
  );

  document.body.style.display =
    "block";

}


/* =========================
   ACCOUNT STATUS
========================= */

async function checkAccountStatus(
  userData
) {

  const accountStatus =
    (
      userData.status ||
      "active"
    ).toLowerCase();


  /* ACTIVE */

  if (
    accountStatus ===
    "active"
  ) {

    return true;

  }


  /* PENDING */

  if (
    accountStatus ===
      "pending" ||
    accountStatus ===
      "under-review"
  ) {

    if (!isPendingPage) {

      window.location.href =
        "../pages/account-pending.html";

    } else {

      document.body.style.display =
        "block";

    }

    return false;

  }


  /* REJECTED */

  if (
    accountStatus ===
    "rejected"
  ) {

    if (!isPendingPage) {

      window.location.href =
        "../pages/account-pending.html?status=rejected";

    } else {

      document.body.style.display =
        "block";

    }

    return false;

  }


  /* SUSPENDED */

  if (
    accountStatus ===
    "suspended"
  ) {

    alert(
      userData.suspensionReason
        ? `Your account has been suspended.\n\nReason: ${userData.suspensionReason}`
        : "Your account has been suspended. Please contact TalentGoldPlus support if you believe this is an error."
    );

    await signOut(
      auth
    );

    window.location.href =
      loginPath;

    return false;

  }


  /* BANNED */

  if (
    accountStatus ===
    "banned"
  ) {

    alert(
      "Your account has been permanently restricted from using TalentGoldPlus."
    );

    await signOut(
      auth
    );

    window.location.href =
      loginPath;

    return false;

  }


  /* ANY UNKNOWN STATUS */

  alert(
    "Your TalentGoldPlus account is currently unavailable."
  );

  await signOut(
    auth
  );

  window.location.href =
    loginPath;

  return false;

}


/* =========================
   HEADER WAIT
========================= */

function waitForHeaderIfRequired() {

  return new Promise(
    (resolve) => {

      const siteHeader =
        document.getElementById(
          "siteHeader"
        );


      /*
        This page does not use
        the shared public header.
      */
      if (!siteHeader) {

        resolve();

        return;

      }


      /*
        Header has already loaded.
        This handles cached/fast loads
        where the event fired before
        auth-state.js started waiting.
      */
      if (
        siteHeader.innerHTML.trim()
      ) {

        resolve();

        return;

      }


      /*
        Listen for a header that is
        still being loaded.
      */
      const handleHeaderLoaded =
        () => {

          resolve();

        };


      document.addEventListener(
        "siteHeaderLoaded",
        handleHeaderLoaded,
        {
          once: true
        }
      );


      /*
        Extra race-condition protection:
        the header could finish between
        the earlier check and listener setup.
      */
      if (
        siteHeader.innerHTML.trim()
      ) {

        document.removeEventListener(
          "siteHeaderLoaded",
          handleHeaderLoaded
        );

        resolve();

      }

    }
  );

}
