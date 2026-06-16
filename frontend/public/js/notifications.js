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
  document.getElementById("notificationCount");

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
    }

    snapshot.forEach((docSnap) => {

      const notification =
        docSnap.data();

      if (!notification.read) {
        unreadCount++;
      }

      if (notificationsList) {

        const item =
          document.createElement("div");

        item.classList.add("notification-item");

        if (!notification.read) {
          item.classList.add("unread");
        }

        item.innerHTML = `
          <p>${notification.message}</p>
          <button data-id="${docSnap.id}" class="mark-read-btn">
            Mark as read
          </button>
        `;

        notificationsList.appendChild(item);

      }

    });

    if (notificationCount) {
      notificationCount.textContent = unreadCount;
    }

    document.querySelectorAll(".mark-read-btn").forEach((button) => {

      button.addEventListener("click", async () => {

        await updateDoc(
          doc(db, "notifications", button.dataset.id),
          {
            read: true
          }
        );

      });

    });

  });

}