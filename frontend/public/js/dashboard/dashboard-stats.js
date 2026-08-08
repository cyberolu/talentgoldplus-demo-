import {
  db
} from "../firebase.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export async function loadDashboardStats(
  userId
) {
  if (!userId) {
    return;
  }

  const connectionsCount =
    document.getElementById(
      "connectionsCount"
    );

  const messagesCount =
    document.getElementById(
      "messagesCount"
    );

  const listingsCount =
    document.getElementById(
      "listingsCount"
    );

  const mediaCount =
    document.getElementById(
      "mediaCount"
    );

  try {
    const [
      sentConnections,
      receivedConnections,
      conversationsSnapshot,
      listingsSnapshot,
      mediaSnapshot
    ] = await Promise.all([
      getDocs(
        query(
          collection(
            db,
            "connections"
          ),
          where(
            "senderId",
            "==",
            userId
          ),
          where(
            "status",
            "==",
            "accepted"
          )
        )
      ),

      getDocs(
        query(
          collection(
            db,
            "connections"
          ),
          where(
            "receiverId",
            "==",
            userId
          ),
          where(
            "status",
            "==",
            "accepted"
          )
        )
      ),

      getDocs(
        query(
          collection(
            db,
            "conversations"
          ),
          where(
            "participants",
            "array-contains",
            userId
          )
        )
      ),

      getDocs(
        query(
          collection(
            db,
            "marketplaceListings"
          ),
          where(
            "userId",
            "==",
            userId
          )
        )
      ),

      getDocs(
        query(
          collection(
            db,
            "userMedia"
          ),
          where(
            "userId",
            "==",
            userId
          )
        )
      )
    ]);

    if (connectionsCount) {
      connectionsCount.textContent =
        sentConnections.size +
        receivedConnections.size;
    }

    if (messagesCount) {
      messagesCount.textContent =
        conversationsSnapshot.size;
    }

    if (listingsCount) {
      listingsCount.textContent =
        listingsSnapshot.size;
    }

    if (mediaCount) {
      mediaCount.textContent =
        mediaSnapshot.size;
    }

  } catch (error) {
    console.error(
      "Dashboard statistics error:",
      error
    );
  }
}