import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const suggestedConnections =
  document.getElementById("suggestedConnections");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  currentUser = user;

  await loadSuggestedConnections();

});

async function loadSuggestedConnections() {

  if (!suggestedConnections) return;

  suggestedConnections.innerHTML =
    "<p>Loading...</p>";

  const usersSnapshot =
    await getDocs(
      collection(db, "users")
    );

  suggestedConnections.innerHTML = "";

  for (const userDoc of usersSnapshot.docs) {

    const userData =
      userDoc.data();

    if (userDoc.id === currentUser.uid) {
      continue;
    }

    const profileImage =
      userData.profileImage &&
      userData.profileImage.startsWith("http")
        ? userData.profileImage
        : "../assets/images/avatar-placeholder.png";

    const displayName =
      userData.fullName ||
      userData.name ||
      "TalentGoldPlus User";

    const role =
      userData.role ||
      "Member";

    const connectionStatus =
      await getConnectionStatus(userDoc.id);

    const card =
      document.createElement("div");

    card.classList.add("connection-card");

    card.innerHTML = `

      <div class="connection-user">

        <img
          src="${profileImage}"
          alt="${displayName}"
          onerror="this.src='../assets/images/avatar-placeholder.png'"
        >

        <div>
          <strong>${displayName}</strong>
          <p>${role}</p>
        </div>

      </div>

      ${renderConnectionButton(connectionStatus, userDoc.id)}

    `;

    suggestedConnections.appendChild(card);

  }

  attachConnectionEvents();

}

async function getConnectionStatus(otherUserId) {

  const sentQuery =
    query(
      collection(db, "connections"),
      where("senderId", "==", currentUser.uid),
      where("receiverId", "==", otherUserId)
    );

  const receivedQuery =
    query(
      collection(db, "connections"),
      where("senderId", "==", otherUserId),
      where("receiverId", "==", currentUser.uid)
    );

  const sentSnapshot =
    await getDocs(sentQuery);

  if (!sentSnapshot.empty) {

    const connectionDoc =
      sentSnapshot.docs[0];

    return {
      exists: true,
      id: connectionDoc.id,
      direction: "sent",
      status: connectionDoc.data().status,
      senderId: connectionDoc.data().senderId,
      receiverId: connectionDoc.data().receiverId
    };

  }

  const receivedSnapshot =
    await getDocs(receivedQuery);

  if (!receivedSnapshot.empty) {

    const connectionDoc =
      receivedSnapshot.docs[0];

    return {
      exists: true,
      id: connectionDoc.id,
      direction: "received",
      status: connectionDoc.data().status,
      senderId: connectionDoc.data().senderId,
      receiverId: connectionDoc.data().receiverId
    };

  }

  return {
    exists: false,
    id: null,
    direction: null,
    status: null,
    senderId: null,
    receiverId: null
  };

}

function renderConnectionButton(connectionStatus, userId) {

  if (
    connectionStatus.exists &&
    connectionStatus.status === "accepted"
  ) {

    return `
      <button class="connect-btn" disabled>
        Connected
      </button>
    `;

  }

  if (
    connectionStatus.exists &&
    connectionStatus.status === "pending" &&
    connectionStatus.direction === "sent"
  ) {

    return `
      <button class="connect-btn" disabled>
        Request Sent
      </button>
    `;

  }

  if (
    connectionStatus.exists &&
    connectionStatus.status === "pending" &&
    connectionStatus.direction === "received"
  ) {

    return `
      <button
        class="connect-btn accept-inline-btn"
        data-connection-id="${connectionStatus.id}"
        data-sender-id="${connectionStatus.senderId}"
      >
        Accept Request
      </button>
    `;

  }

  return `
    <button
      class="connect-btn send-connect-btn"
      data-user-id="${userId}"
    >
      Connect
    </button>
  `;

}

function attachConnectionEvents() {

  document.querySelectorAll(".send-connect-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        const receiverId =
          button.dataset.userId;

        await addDoc(
          collection(db, "connections"),
          {
            senderId: currentUser.uid,
            receiverId: receiverId,
            status: "pending",
            createdAt: serverTimestamp()
          }
        );

        await addDoc(
          collection(db, "notifications"),
          {
            userId: receiverId,
            type: "connection_request",
            message: "You have a new connection request.",
            read: false,
            createdAt: serverTimestamp()
          }
        );

        button.textContent =
          "Request Sent";

        button.disabled = true;

      });

    });

  document.querySelectorAll(".accept-inline-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        const connectionId =
          button.dataset.connectionId;

        const senderId =
          button.dataset.senderId;

        await updateDoc(
          doc(db, "connections", connectionId),
          {
            status: "accepted"
          }
        );

        await addDoc(
          collection(db, "notifications"),
          {
            userId: senderId,
            type: "connection_accepted",
            message: "Your connection request was accepted.",
            read: false,
            createdAt: serverTimestamp()
          }
        );

        button.textContent =
          "Connected";

        button.disabled = true;

      });

    });

}