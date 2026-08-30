import {
  auth
} from "../firebase.js";

import {
  getInitials,
  calculateProfileStrength
} from "../utils/user-helpers.js";

import {
  loadDashboardStats
} from "./dashboard-stats.js";


export function renderDashboard(
  userData
) {

  const user =
    auth.currentUser;


  if (!user) {

    return;

  }


  const role =
    userData.role ||
    "athlete";


  const name =
    userData.fullName ||
    userData.name ||
    "User";


  const sport =
    userData.sport ||
    userData.category ||
    "";


  const location =
    userData.location ||
    "";


  const profileStatus =
    userData.profileCompleted
      ? "Complete"
      : "Incomplete";


  const hasProfileImage =
    userData.profileImage &&
    userData.profileImage.startsWith(
      "http"
    );


  const avatarHtml =
    hasProfileImage
      ? `
        <img
          src="${userData.profileImage}"
          alt="${name}"
          class="portal-user-avatar"
        >
      `
      : `
        <div
          class="portal-user-avatar initials-avatar"
        >
          ${getInitials(name)}
        </div>
      `;


  const welcomeMessage =
    document.getElementById(
      "welcomeMessage"
    );


  const dashboardName =
    document.getElementById(
      "dashboardName"
    );


  const dashboardAvatar =
    document.getElementById(
      "dashboardAvatar"
    );


  const roleText =
    document.getElementById(
      "roleText"
    );


  const profileCompletion =
    document.getElementById(
      "profileCompletion"
    );


  const profilePreview =
    document.getElementById(
      "profilePreview"
    );


  if (welcomeMessage) {

    welcomeMessage.textContent =
      name;

  }


  if (dashboardName) {

    dashboardName.textContent =
      name;

  }


  if (dashboardAvatar) {

    dashboardAvatar.textContent =
      getInitials(name);

  }


  if (roleText) {

    roleText.innerHTML = `
      <strong>Role:</strong> ${role}<br>
      <strong>Sport or Category:</strong> ${sport || "Not set"}<br>
      <strong>Location:</strong> ${location || "Not set"}<br>
      <strong>Profile:</strong> ${profileStatus}
    `;

  }


  if (profileCompletion) {

    profileCompletion.textContent =
      `${calculateProfileStrength(
        userData
      )}%`;

  }


  if (profilePreview) {

    profilePreview.innerHTML = `
      <div class="dashboard-profile-card">

        ${avatarHtml}

        <div>

          <h3>
            ${name}
          </h3>

          <p>
            ${role}
          </p>

          <p>
            ${sport || "No category set"}
          </p>

        </div>

      </div>
    `;

  }


  renderDashboardNavigation(
    role,
    user.uid
  );


  renderDashboardCards(
    role,
    user.uid
  );


  loadDashboardStats(
    user.uid
  );

}


/* =========================
   DASHBOARD NAVIGATION
========================= */

function renderDashboardNavigation(
  role,
  userId
) {

  const dashboardNav =
    document.getElementById(
      "dashboardNav"
    );


  if (!dashboardNav) {

    return;

  }


  dashboardNav.innerHTML = `

    <a
      href="/dashboard"
      class="active"
    >
      Dashboard
    </a>


    <a
      href="/profile?user=${userId}"
    >
      View My Profile
    </a>


    <a href="/profile-setup">
      Edit Profile
    </a>


    <a href="/media">
      My Media
    </a>


    <a href="/community">
      Community
    </a>


    <a href="/events">
      Events
    </a>


    <a href="/connections">
      Connections
    </a>


    <a href="/messages">
      Messages
    </a>


    <a href="/marketplace">
      Marketplace
    </a>


    <a href="/my-submissions">
      My Submissions
    </a>


    <a href="/raise-funds">
      Raise Funds
    </a>


    <a href="/notifications">
      Notifications
    </a>


    ${
      role === "admin" ||
      role === "superadmin"
        ? `
          <a href="../admin//">
            Admin
          </a>
        `
        : ""
    }

  `;

}


/* =========================
   QUICK ACTION CARDS
========================= */

function renderDashboardCards(
  role,
  userId
) {

  const dashboardCards =
    document.getElementById(
      "dashboardCards"
    );


  if (!dashboardCards) {

    return;

  }


  const commonCards = `

    <a
      href="/profile?user=${userId}"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            View My Profile
          </h3>

          <p>
            See how your public profile appears to others.
          </p>

        </div>

      </div>

    </a>


    <a
      href="/community"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            Community
          </h3>

          <p>
            Connect with athletes, coaches and professionals.
          </p>

        </div>

      </div>

    </a>


    <a
      href="/events"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            Events
          </h3>

          <p>
            Discover upcoming events, trials, camps,
            workshops and activities.
          </p>

        </div>

      </div>

    </a>


    <a
      href="/marketplace"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            Marketplace
          </h3>

          <p>
            Find services, opportunities and support.
          </p>

        </div>

      </div>

    </a>


    <a
      href="/my-submissions"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            My Submissions
          </h3>

          <p>
            Track your listings, events, opportunities
            and fundraisers.
          </p>

        </div>

      </div>

    </a>


    <a
      href="/messages"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            Messages
          </h3>

          <p>
            Communicate with your network.
          </p>

        </div>

      </div>

    </a>

  `;


  const adminCard = `

    <a
      href="../admin//"
      class="dashboard-card-link"
    >

      <div class="athlete-card">

        <div class="athlete-info">

          <h3>
            Admin Panel
          </h3>

          <p>
            Manage users, approvals and platform settings.
          </p>

        </div>

      </div>

    </a>

  `;


  dashboardCards.innerHTML =
    commonCards +
    (
      role === "admin" ||
      role === "superadmin"
        ? adminCard
        : ""
    );

}

