import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const profileContent =
  document.getElementById("profileContent");

let currentUser = null;
let viewedUserId = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "/login";
    return;
  }

  currentUser = user;

  const params =
    new URLSearchParams(window.location.search);

  viewedUserId =
    params.get("user");

  if (!viewedUserId) {
    profileContent.innerHTML =
      "<p>No profile selected.</p>";
    return;
  }

  await loadProfile();

});

async function loadProfile() {

  const userRef =
    doc(db, "users", viewedUserId);

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {
    profileContent.innerHTML =
      "<p>This profile could not be found.</p>";
    return;
  }

  const userData =
    userSnap.data();

  const isOwnProfile =
    currentUser.uid === viewedUserId;

  const image =
    userData.profileImage &&
    userData.profileImage.startsWith("http")
      ? userData.profileImage
      : "../assets/images/avatar-placeholder.png";

  profileContent.innerHTML = `
    <div class="public-profile-header">

      <img
        src="${image}"
        alt="${getDisplayName(userData)}"
        class="public-profile-image"
        onerror="this.src='../assets/images/avatar-placeholder.png'"
      >

      <div>
        <span class="public-profile-badge">
          ${getRoleLabel(userData)}
        </span>

        <h1>${getDisplayName(userData)}</h1>

        <p>
          ${getProfileHeadline(userData)}
        </p>

        <p>
          📍 ${userData.location || "Location not set"}
        </p>
      </div>

    </div>

    <div class="public-profile-section">
      <h2>${getAboutTitle(userData)}</h2>
      <p>${userData.bio || "No bio added yet."}</p>
    </div>


    ${renderProfileDetails(userData)}

    ${await renderMediaGallery()}

    <div class="public-profile-actions">

      ${
        isOwnProfile
          ? `
            <a href="/profile-setup" class="btn-primary">
              Edit Profile
            </a>
          `
          : `
            <button
              class="btn-primary"
              id="messageUserBtn"
            >
              Message
            </button>

            <a href="/connections" class="btn-secondary">
              View Connections
            </a>
          `
      }

      <a href="/dashboard" class="btn-secondary">
        Back to Dashboard
      </a>

    </div>
  `;

  const messageUserBtn =
    document.getElementById("messageUserBtn");

  if (messageUserBtn) {
    messageUserBtn.addEventListener("click", async () => {
      await openConversation(viewedUserId);
    });
  }

}

function renderProfileDetails(userData) {

  const role =
    userData.role || "member";

  if (role === "athlete") {
    return renderAthleteDetails(userData);
  }

  if (role === "professional") {
    return renderProfessionalDetails(userData);
  }

  if (role === "scout") {
    return renderScoutDetails(userData);
  }

  if (role === "investor") {
    return renderInvestorDetails(userData);
  }

  return "";
}

function renderAthleteDetails(userData) {

  return `
    <div class="public-profile-section">
      <h2>Athlete Profile</h2>

      <div class="profile-detail-grid">

        <div class="profile-detail-box">
          <span>Sport</span>
          <strong>${formatText(userData.sport || "Not set")}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Performance</span>
          <strong>${userData.pbs || "Not set"}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Role</span>
          <strong>Athlete</strong>
        </div>

      </div>
    </div>

    <div class="public-profile-section">
      <h2>Achievements</h2>
      <p>${userData.achievements || "No achievements added yet."}</p>
    </div>
  `;

}

function renderProfessionalDetails(userData) {

  return `
    <div class="public-profile-section">
      <h2>Professional Profile</h2>

      <div class="profile-detail-grid">

        <div class="profile-detail-box">
          <span>Category</span>
          <strong>${formatText(userData.professionalCategory || "Professional")}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Qualifications</span>
          <strong>${userData.qualifications || "Not set"}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Role</span>
          <strong>Professional</strong>
        </div>

      </div>
    </div>

    <div class="public-profile-section">
      <h2>Services</h2>
      <p>${userData.services || "No services added yet."}</p>
    </div>
  `;

}

function renderScoutDetails(userData) {

  return `
    <div class="public-profile-section">
      <h2>Scout Profile</h2>

      <div class="profile-detail-grid">

        <div class="profile-detail-box">
          <span>Organisation</span>
          <strong>${userData.organisation || "Not set"}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Sport Focus</span>
          <strong>${formatText(userData.sport || "Not set")}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Region</span>
          <strong>${userData.scoutingRegion || "Not set"}</strong>
        </div>

      </div>
    </div>
  `;

}

function renderInvestorDetails(userData) {

  return `
    <div class="public-profile-section">
      <h2>Investor Profile</h2>

      <div class="profile-detail-grid">

        <div class="profile-detail-box">
          <span>Company</span>
          <strong>${userData.companyName || "Not set"}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Interests</span>
          <strong>${userData.investmentInterests || "Not set"}</strong>
        </div>

        <div class="profile-detail-box">
          <span>Funding Range</span>
          <strong>${userData.fundingRange || "Not set"}</strong>
        </div>

      </div>
    </div>
  `;

}

function getDisplayName(userData) {
  return (
    userData.fullName ||
    userData.name ||
    "TalentGoldPlus User"
  );
}

function getRoleLabel(userData) {

  if (userData.role === "professional" && userData.professionalCategory) {
    return formatText(userData.professionalCategory);
  }

  return formatText(userData.role || "Member");

}

function getProfileHeadline(userData) {

  if (userData.role === "athlete") {
    return `${formatText(userData.sport || "Athlete")} • ${userData.pbs || "Performance profile"}`;
  }

  if (userData.role === "professional") {
    return `${formatText(userData.professionalCategory || "Professional")} • ${userData.services || "Support services"}`;
  }

  if (userData.role === "scout") {
    return `${userData.organisation || "Scout"} • ${userData.scoutingRegion || "Region not set"}`;
  }

  if (userData.role === "investor") {
    return `${userData.companyName || "Investor"} • ${userData.investmentInterests || "Sports investment"}`;
  }

  return "TalentGoldPlus member";

}

function getAboutTitle(userData) {

  if (userData.role === "athlete") {
    return `About ${getDisplayName(userData)}`;
  }

  if (userData.role === "professional") {
    return "Professional Overview";
  }

  if (userData.role === "scout") {
    return "Scout Overview";
  }

  if (userData.role === "investor") {
    return "Investor Overview";
  }

  return "About";

}

function getConversationId(userA, userB) {
  return [userA, userB]
    .sort()
    .join("_");
}

async function openConversation(otherUserId) {

  const conversationId =
    getConversationId(
      currentUser.uid,
      otherUserId
    );

  const conversationRef =
    doc(db, "conversations", conversationId);

  await setDoc(
    conversationRef,
    {
      participants: [
        currentUser.uid,
        otherUserId
      ],
      lastMessage: "",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    {
      merge: true
    }
  );

  window.location.href =
    `/messages?conversation=${conversationId}`;

}

function renderProfileStrength(userData) {

  const checks = [
    {
      label: "Profile photo",
      complete:
        userData.profileImage &&
        userData.profileImage.startsWith("http")
    },
    {
      label: "Full name",
      complete:
        !!(userData.fullName || userData.name)
    },
    {
      label: "Location",
      complete:
        !!userData.location
    },
    {
      label: "Bio",
      complete:
        !!userData.bio
    }
  ];

  if (userData.role === "athlete") {
    checks.push(
      {
        label: "Sport",
        complete: !!userData.sport
      },
      {
        label: "Performance details",
        complete: !!userData.pbs
      },
      {
        label: "Achievements",
        complete: !!userData.achievements
      }
    );
  }

  if (userData.role === "professional") {
    checks.push(
      {
        label: "Professional category",
        complete: !!userData.professionalCategory
      },
      {
        label: "Qualifications",
        complete: !!userData.qualifications
      },
      {
        label: "Services",
        complete: !!userData.services
      }
    );
  }

  const completed =
    checks.filter((item) => item.complete).length;

  const percentage =
    Math.round((completed / checks.length) * 100);

  return `
    <div class="public-profile-section">
      <h2>Profile Strength</h2>

      <div class="profile-strength-bar">
        <div style="width: ${percentage}%"></div>
      </div>

      <p><strong>${percentage}% complete</strong></p>

      <div class="profile-strength-list">
        ${checks.map((item) => `
          <span class="${item.complete ? "complete" : "missing"}">
            ${item.complete ? "✓" : "○"} ${item.label}
          </span>
        `).join("")}
      </div>
    </div>
  `;

}

async function renderMediaGallery() {

  const mediaQuery =
    query(
      collection(db, "userMedia"),
      where("userId", "==", viewedUserId),
      orderBy("createdAt", "desc")
    );

  const snapshot =
    await getDocs(mediaQuery);

  if (snapshot.empty) {
    return "";
  }

  let html = `
    <div class="public-profile-section">

      <h2>Media Gallery</h2>

      <div class="profile-media-grid">
  `;

  snapshot.forEach((docSnap) => {

    const media =
      docSnap.data();

    if (media.type === "video-link") {

      html += `
        <a
          href="${media.mediaUrl}"
          target="_blank"
          class="profile-video-card"
        >
          🎥
          <span>${media.title}</span>
        </a>
      `;

    } else {

      html += `
        <img
          src="${media.mediaUrl}"
          alt="${media.title}"
          class="profile-gallery-image"
        >
      `;

    }

  });

  html += `
      </div>
    </div>
  `;

  return html;

}

function formatText(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
