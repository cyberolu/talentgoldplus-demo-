import {
  db
} from "../firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


let unsubscribeNotifications =
  null;


export function listenForNotifications(
  userId
) {

  if (!userId) {
    return;
  }


  if (
    unsubscribeNotifications
  ) {

    unsubscribeNotifications();

    unsubscribeNotifications =
      null;

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


        if (
          !notificationsCount
        ) {

          return;

        }


        const unreadCount =
          snapshot.size;


        notificationsCount.textContent =
          unreadCount;


        notificationsCount.hidden =
          unreadCount === 0;

      },

      (error) => {

        console.error(
          "Notification listener error:",
          error
        );

      }

    );

}


export function stopNotificationListener() {

  if (
    unsubscribeNotifications
  ) {

    unsubscribeNotifications();

    unsubscribeNotifications =
      null;

  }

}