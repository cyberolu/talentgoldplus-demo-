import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const profileContent =
  document.getElementById("profileContent");

let currentUser = null;
let viewedUserId = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
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
        <h1>${getDisplayName(userData)}</h1>
        <p>${userData.role || "Member"}</p>
        <p>${userData.location || "Location not set"}</p>
      </div>

    </div>

    <div class="public-profile-section">
      <h2>About</h2>
      <p>${userData.bio || "No bio added yet."}</p>
    </div>

    ${renderProfileDetails(userData)}

    <div class="public-profile-actions">

      ${
        isOwnProfile
          ? `
            <a href="profile-setup.html" class="btn-primary">
              Edit My Profile
            </a>
          `
          : `
            <button
              class="btn-primary"
              id="messageUserBtn"
            >
              Message
            </button>

            <a href="connections.html" class="btn-secondary">
              View Connections
            </a>
          `
      }

      <a href="dashboard.html" class="btn-secondary">
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

function getDisplayName(userData) {

  return (
    userData.fullName ||
    userData.name ||
    "TalentGoldPlus User"
  );

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
    `messages.html?conversation=${conversationId}`;

}
function renderProfileDetails(userData) {

  const details = [];

  if (userData.sport || userData.category) {
    details.push(`
      <p><strong>Sport/Category:</strong> ${userData.sport || userData.category}</p>
    `);
  }

  if (userData.pbs) {
    details.push(`
      <p><strong>Personal Bests / Position:</strong> ${userData.pbs}</p>
    `);
  }

  if (userData.achievements) {
    details.push(`
      <p><strong>Achievements:</strong> ${userData.achievements}</p>
    `);
  }

  if (userData.qualifications) {
    details.push(`
      <p><strong>Qualifications:</strong> ${userData.qualifications}</p>
    `);
  }

  if (userData.services) {
    details.push(`
      <p><strong>Services:</strong> ${userData.services}</p>
    `);
  }

  if (userData.organisation) {
    details.push(`
      <p><strong>Organisation:</strong> ${userData.organisation}</p>
    `);
  }

  if (userData.scoutingRegion) {
    details.push(`
      <p><strong>Scouting Region:</strong> ${userData.scoutingRegion}</p>
    `);
  }

  if (userData.investmentInterests) {
    details.push(`
      <p><strong>Investment Interests:</strong> ${userData.investmentInterests}</p>
    `);
  }

  if (details.length === 0) {
    return "";
  }

  return `
    <div class="public-profile-section">
      <h2>Profile Details</h2>
      ${details.join("")}
    </div>
  `;

}