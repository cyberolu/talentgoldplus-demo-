import {
  db
} from "../firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let unsubscribeNotifications = null;

export function listenForNotifications(
  userId
) {
  if (!userId) {
    return;
  }

  if (unsubscribeNotifications) {
    unsubscribeNotifications();
  }

  const notificationsQuery =
    query(
      collection(
        db,
        "notifications"
      ),
      where(
        "userId",
        "==",
        userId
      ),
      where(
        "read",
        "==",
        false
      )
    );

  unsubscribeNotifications =
    onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsCount =
          document.getElementById(
            "notificationsCount"
          );

        if (notificationsCount) {
          notificationsCount.textContent =
            snapshot.size;
        }
      },
      (error) => {
        console.error(
          "Notification listener error:",
          error
        );
      }
    );
}