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


  /* =========================
     MAIN DASHBOARD COUNTERS
  ========================= */

  const connectionsCount =
    document.getElementById(
      "connectionsCount"
    );

  const messagesCount =
    document.getElementById(
      "messagesCount"
    );

  const mediaCount =
    document.getElementById(
      "mediaCount"
    );


  /* =========================
     MARKETPLACE COUNTERS
  ========================= */

  const approvedListingsCount =
    document.getElementById(
      "approvedListingsCount"
    );

  const pendingListingsCount =
    document.getElementById(
      "pendingListingsCount"
    );

  const rejectedListingsCount =
    document.getElementById(
      "rejectedListingsCount"
    );


  /* =========================
     EVENT COUNTERS
  ========================= */

  const approvedEventsCount =
    document.getElementById(
      "approvedEventsCount"
    );

  const pendingEventsCount =
    document.getElementById(
      "pendingEventsCount"
    );

  const rejectedEventsCount =
    document.getElementById(
      "rejectedEventsCount"
    );


  /* =========================
     OPPORTUNITY COUNTERS
  ========================= */

  const approvedOpportunitiesCount =
    document.getElementById(
      "approvedOpportunitiesCount"
    );

  const pendingOpportunitiesCount =
    document.getElementById(
      "pendingOpportunitiesCount"
    );

  const rejectedOpportunitiesCount =
    document.getElementById(
      "rejectedOpportunitiesCount"
    );


  /* =========================
     FUNDRAISER COUNTERS
  ========================= */

  const approvedFundraisersCount =
    document.getElementById(
      "approvedFundraisersCount"
    );

  const pendingFundraisersCount =
    document.getElementById(
      "pendingFundraisersCount"
    );

  const rejectedFundraisersCount =
    document.getElementById(
      "rejectedFundraisersCount"
    );


  try {

    const [
      sentConnections,
      receivedConnections,
      conversationsSnapshot,
      mediaSnapshot,
      listingsSnapshot,
      eventsSnapshot,
      opportunitiesSnapshot,
      fundraisersSnapshot
    ] = await Promise.all([

      /* SENT CONNECTIONS */

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


      /* RECEIVED CONNECTIONS */

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


      /* CONVERSATIONS */

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


      /* MEDIA */

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
      ),


      /* MARKETPLACE */

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


      /* EVENTS */

      getDocs(
        query(
          collection(
            db,
            "events"
          ),
          where(
            "organiserId",
            "==",
            userId
          )
        )
      ),


      /* OPPORTUNITIES */

      getDocs(
        query(
          collection(
            db,
            "opportunities"
          ),
          where(
            "createdBy",
            "==",
            userId
          )
        )
      ),


      /* FUNDRAISERS */

      getDocs(
        query(
          collection(
            db,
            "fundraisers"
          ),
          where(
            "createdBy",
            "==",
            userId
          )
        )
      )

    ]);


    /* =========================
       CONNECTIONS
    ========================= */

    if (connectionsCount) {

      connectionsCount.textContent =
        sentConnections.size +
        receivedConnections.size;

    }


    /* =========================
       MESSAGES
    ========================= */

    if (messagesCount) {

      messagesCount.textContent =
        conversationsSnapshot.size;

    }


    /* =========================
       MEDIA
    ========================= */

    if (mediaCount) {

      mediaCount.textContent =
        mediaSnapshot.size;

    }


    /* =========================
       MARKETPLACE STATUS
    ========================= */

    const listingStats =
      countStatuses(
        listingsSnapshot
      );

    if (approvedListingsCount) {
      approvedListingsCount.textContent =
        listingStats.approved;
    }

    if (pendingListingsCount) {
      pendingListingsCount.textContent =
        listingStats.pending;
    }

    if (rejectedListingsCount) {
      rejectedListingsCount.textContent =
        listingStats.rejected;
    }


    /* =========================
       EVENT STATUS
    ========================= */

    const eventStats =
      countStatuses(
        eventsSnapshot
      );

    if (approvedEventsCount) {
      approvedEventsCount.textContent =
        eventStats.approved;
    }

    if (pendingEventsCount) {
      pendingEventsCount.textContent =
        eventStats.pending;
    }

    if (rejectedEventsCount) {
      rejectedEventsCount.textContent =
        eventStats.rejected;
    }


    /* =========================
       OPPORTUNITY STATUS
    ========================= */

    const opportunityStats =
      countStatuses(
        opportunitiesSnapshot
      );

    if (approvedOpportunitiesCount) {
      approvedOpportunitiesCount.textContent =
        opportunityStats.approved;
    }

    if (pendingOpportunitiesCount) {
      pendingOpportunitiesCount.textContent =
        opportunityStats.pending;
    }

    if (rejectedOpportunitiesCount) {
      rejectedOpportunitiesCount.textContent =
        opportunityStats.rejected;
    }


    /* =========================
       FUNDRAISER STATUS
    ========================= */

    const fundraiserStats =
      countStatuses(
        fundraisersSnapshot
      );

    if (approvedFundraisersCount) {
      approvedFundraisersCount.textContent =
        fundraiserStats.approved;
    }

    if (pendingFundraisersCount) {
      pendingFundraisersCount.textContent =
        fundraiserStats.pending;
    }

    if (rejectedFundraisersCount) {
      rejectedFundraisersCount.textContent =
        fundraiserStats.rejected;
    }

  } catch (error) {

    console.error(
      "Dashboard statistics error:",
      error
    );

  }

}


/* =========================
   STATUS COUNTER
========================= */

function countStatuses(
  snapshot
) {

  const totals = {
    approved: 0,
    pending: 0,
    rejected: 0
  };

  snapshot.forEach(
    (document) => {

      const status =
        document.data()?.status;

      if (
        status === "approved" ||
        status === "published"
      ) {
        totals.approved += 1;
      }

      if (
        status === "pending"
      ) {
        totals.pending += 1;
      }

      if (
        status === "rejected"
      ) {
        totals.rejected += 1;
      }

    }
  );

  return totals;
}