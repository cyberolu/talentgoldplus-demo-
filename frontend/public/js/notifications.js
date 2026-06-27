import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const notificationsList =
  document.getElementById("notificationsList");

  const notificationCount =
  document.getElementById("notificationsCount");
  
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  loadNotifications(user.uid);

});

function loadNotifications(userId) {

  const q =
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

  onSnapshot(q, (snapshot) => {

    let unreadCount = 0;

    if (notificationsList) {
      notificationsList.innerHTML = "";
    }

    if (snapshot.empty && notificationsList) {
      notificationsList.innerHTML =
        "<p>No notifications yet.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {

      const notification =
        docSnap.data();

      if (!notification.read) {
        unreadCount++;
      }

      const item =
        document.createElement("div");

      item.classList.add("notification-item");

      if (!notification.read) {
        item.classList.add("unread");
      }

      item.innerHTML = `
        <div>
          <p>${notification.message || "New notification"}</p>
          <small>${formatNotificationType(notification.type)}</small>
        </div>

        <button
          data-id="${docSnap.id}"
          data-type="${notification.type || ""}"
          data-conversation-id="${notification.conversationId || ""}"
          class="open-notification-btn"
        >
          ${getButtonText(notification.type)}
        </button>
      `;

      notificationsList.appendChild(item);

    });

    if (notificationCount) {
      notificationCount.textContent = unreadCount;
    }

    attachNotificationEvents();

  });

}

function attachNotificationEvents() {

  document
    .querySelectorAll(".open-notification-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        const notificationId =
          button.dataset.id;

        const type =
          button.dataset.type;

        const conversationId =
          button.dataset.conversationId;

        await updateDoc(
          doc(db, "notifications", notificationId),
          {
            read: true
          }
        );

        if (type === "new_message" && conversationId) {
          window.location.href =
            `messages.html?conversation=${conversationId}`;
          return;
        }

        if (type === "connection_accepted") {
          window.location.href =
            "connections.html";
          return;
        }

        window.location.href =
          "dashboard.html";

      });

    });

}

function getButtonText(type) {

  if (type === "new_message") {
    return "Open Message";
  }

  if (type === "connection_accepted") {
    return "View Connection";
  }

  return "Open";

}

function formatNotificationType(type) {

  if (type === "new_message") {
    return "Message";
  }

  if (type === "connection_accepted") {
    return "Connection";
  }

  return "Notification";

}