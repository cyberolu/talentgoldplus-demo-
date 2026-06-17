import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const pendingRequests =
  document.getElementById("pendingRequests");

const acceptedConnections =
  document.getElementById("acceptedConnections");

const sentRequests =
  document.getElementById("sentRequests");

const connectionSearch =
  document.getElementById("connectionSearch");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  currentUser = user;

  await loadConnectionsDashboard();

});

async function loadConnectionsDashboard() {

  await loadPendingRequests();
  await loadAcceptedConnections();
  await loadSentRequests();

}

async function getUserData(userId) {

  const userRef =
    doc(db, "users", userId);

  const userSnap =
    await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }

  return {
    name: "TalentGoldPlus User",
    role: "Member",
    profileImage: ""
  };

}

function getDisplayName(userData) {

  return (
    userData.fullName ||
    userData.name ||
    "TalentGoldPlus User"
  );

}

function getProfileImage(userData) {

  if (
    userData.profileImage &&
    userData.profileImage.startsWith("http")
  ) {
    return userData.profileImage;
  }

  return "../assets/images/avatar-placeholder.png";

}

async function loadPendingRequests() {

  pendingRequests.innerHTML =
    "<p>Loading...</p>";

  const q =
    query(
      collection(db, "connections"),
      where("receiverId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

  const snapshot =
    await getDocs(q);

  pendingRequests.innerHTML = "";

  if (snapshot.empty) {
    pendingRequests.innerHTML =
      "<p>No pending requests.</p>";
    return;
  }

  for (const connectionDoc of snapshot.docs) {

    const connection =
      connectionDoc.data();

    const senderData =
      await getUserData(connection.senderId);

    const card =
      document.createElement("div");

    card.classList.add("connection-dashboard-card");

    card.innerHTML = `
      <img
        src="${getProfileImage(senderData)}"
        alt="${getDisplayName(senderData)}"
        onerror="this.src='../assets/images/avatar-placeholder.png'"
      >

      <div>
        <h3>
          <a href="profile.html?user=${connection.senderId}">
            ${getDisplayName(senderData)}
          </a>
        </h3>
        <p>${senderData.role || "Member"}</p>
      </div>

      <div class="connection-actions">
        <button
          class="accept-btn"
          data-connection-id="${connectionDoc.id}"
        >
          Accept
        </button>

        <button
          class="decline-btn"
          data-connection-id="${connectionDoc.id}"
        >
          Decline
        </button>
      </div>
    `;

    pendingRequests.appendChild(card);

  }

  attachRequestButtons();

}

function attachRequestButtons() {

  document.querySelectorAll(".accept-btn").forEach((button) => {

    button.addEventListener("click", async () => {

      const connectionId =
        button.dataset.connectionId;

      const connectionRef =
        doc(db, "connections", connectionId);

      const connectionSnap =
        await getDoc(connectionRef);

      if (!connectionSnap.exists()) return;

      const connection =
        connectionSnap.data();

      await updateDoc(
        connectionRef,
        {
          status: "accepted"
        }
      );

      await addDoc(
        collection(db, "notifications"),
        {
          userId: connection.senderId,
          type: "connection_accepted",
          message: "Your connection request was accepted.",
          read: false,
          createdAt: serverTimestamp()
        }
      );

      await loadConnectionsDashboard();

    });

  });

  document.querySelectorAll(".decline-btn").forEach((button) => {

    button.addEventListener("click", async () => {

      const connectionId =
        button.dataset.connectionId;

      await updateDoc(
        doc(db, "connections", connectionId),
        {
          status: "declined"
        }
      );

      await loadConnectionsDashboard();

    });

  });

}

async function loadAcceptedConnections() {

  acceptedConnections.innerHTML =
    "<p>Loading...</p>";

  const sentAcceptedQuery =
    query(
      collection(db, "connections"),
      where("senderId", "==", currentUser.uid),
      where("status", "==", "accepted")
    );

  const receivedAcceptedQuery =
    query(
      collection(db, "connections"),
      where("receiverId", "==", currentUser.uid),
      where("status", "==", "accepted")
    );

  const sentSnapshot =
    await getDocs(sentAcceptedQuery);

  const receivedSnapshot =
    await getDocs(receivedAcceptedQuery);

  acceptedConnections.innerHTML = "";

  const allConnections = [
    ...sentSnapshot.docs,
    ...receivedSnapshot.docs
  ];

  if (allConnections.length === 0) {
    acceptedConnections.innerHTML =
      "<p>No accepted connections yet.</p>";
    return;
  }

  for (const connectionDoc of allConnections) {

    const connection =
      connectionDoc.data();

    const otherUserId =
      connection.senderId === currentUser.uid
        ? connection.receiverId
        : connection.senderId;

    const otherUser =
      await getUserData(otherUserId);

    const card =
      document.createElement("div");

    card.classList.add("connection-list-item");

    card.innerHTML = `
      <div class="connection-list-left">

        <img
          src="${getProfileImage(otherUser)}"
          alt="${getDisplayName(otherUser)}"
          onerror="this.src='../assets/images/avatar-placeholder.png'"
        >

        <div class="connection-list-info">
          <h3>
            <a href="profile.html?user=${otherUserId}">
              ${getDisplayName(otherUser)}
            </a>
          </h3>
          <p>${otherUser.role || "Member"}</p>
        </div>

      </div>

      <button
        type="button"
        class="message-connection-btn"
        data-user-id="${otherUserId}"
      >
        Message
      </button>
    `;

    acceptedConnections.appendChild(card);

  }

  attachMessageButtons();

}

async function loadSentRequests() {

  sentRequests.innerHTML =
    "<p>Loading...</p>";

  const q =
    query(
      collection(db, "connections"),
      where("senderId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

  const snapshot =
    await getDocs(q);

  sentRequests.innerHTML = "";

  if (snapshot.empty) {
    sentRequests.innerHTML =
      "<p>No sent requests.</p>";
    return;
  }

  for (const connectionDoc of snapshot.docs) {

    const connection =
      connectionDoc.data();

    const receiverData =
      await getUserData(connection.receiverId);

    const card =
      document.createElement("div");

    card.classList.add("connection-dashboard-card");

    card.innerHTML = `
      <img
        src="${getProfileImage(receiverData)}"
        alt="${getDisplayName(receiverData)}"
        onerror="this.src='../assets/images/avatar-placeholder.png'"
      >

      <div>
        <h3>
          <a href="profile.html?user=${connection.receiverId}">
            ${getDisplayName(receiverData)}
          </a>
        </h3>
        <p>${receiverData.role || "Member"}</p>
        <span class="pending-label">Request sent</span>
      </div>
    `;

    sentRequests.appendChild(card);

  }

}

function getConversationId(userA, userB) {

  return [userA, userB]
    .sort()
    .join("_");

}

async function createOrOpenConversation(otherUserId) {

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

function attachMessageButtons() {

  document.querySelectorAll(".message-connection-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        const otherUserId =
          button.dataset.userId;

        if (!otherUserId) {
          alert("User ID missing.");
          return;
        }

        await createOrOpenConversation(otherUserId);

      });

    });

}

if (connectionSearch) {

  connectionSearch.addEventListener("input", () => {

    const search =
      connectionSearch.value.toLowerCase();

    document
      .querySelectorAll(".connection-list-item")
      .forEach((item) => {

        const text =
          item.textContent.toLowerCase();

        item.style.display =
          text.includes(search)
            ? "flex"
            : "none";

      });

  });

}