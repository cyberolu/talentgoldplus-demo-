import {
  auth,
  db
} from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


const allowedRoles = [
  "admin",
  "superadmin"
];


const adminWelcome =
  document.getElementById(
    "adminWelcome"
  );

const totalUsers =
  document.getElementById(
    "totalUsers"
  );

const pendingUsers =
  document.getElementById(
    "pendingUsers"
  );

const pendingApprovals =
  document.getElementById(
    "pendingApprovals"
  );

const approvedContent =
  document.getElementById(
    "approvedContent"
  );

const archivedContent =
  document.getElementById(
    "archivedContent"
  );

const totalReports =
  document.getElementById(
    "totalReports"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "/login";

      return;
    }


    const userRef =
      doc(
        db,
        "users",
        user.uid
      );


    const userSnap =
      await getDoc(
        userRef
      );


    if (!userSnap.exists()) {

      window.location.href =
        "/dashboard";

      return;
    }


    const userData =
      userSnap.data();


    const role =
      userData.role ||
      "member";


    if (
      !allowedRoles.includes(
        role
      )
    ) {

      alert(
        "You do not have permission to access the admin panel."
      );

      window.location.href =
        "/dashboard";

      return;
    }


    document.body.style.display =
      "block";


    if (adminWelcome) {

      adminWelcome.textContent =
        `Welcome ${
          userData.name ||
          userData.fullName ||
          "Admin"
        } (${role})`;

    }


    await loadAdminStats();

  }
);


/* =========================================================
   LOAD ADMIN STATISTICS
========================================================= */

async function loadAdminStats() {

  try {

    const [
      usersSnapshot,
      pendingUsersSnapshot,

      pendingListingsSnapshot,
      pendingOpportunitiesSnapshot,
      pendingFundraisersSnapshot,
      pendingEventsSnapshot,

      approvedListingsSnapshot,
      approvedOpportunitiesSnapshot,
      approvedFundraisersSnapshot,
      approvedEventsSnapshot,

      archiveRecordsSnapshot,
      reportsSnapshot
    ] = await Promise.all([


      /* =========================
         USERS
      ========================= */

      getDocs(
        collection(
          db,
          "users"
        )
      ),


      getDocs(
        query(
          collection(
            db,
            "users"
          ),
          where(
            "status",
            "==",
            "pending"
          )
        )
      ),


      /* =========================
         PENDING MARKETPLACE
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "marketplaceListings"
          ),
          where(
            "status",
            "==",
            "pending"
          )
        )
      ),


      /* =========================
         PENDING OPPORTUNITIES
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "opportunities"
          ),
          where(
            "status",
            "==",
            "pending"
          )
        )
      ),


      /* =========================
         PENDING FUNDRAISERS
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "fundraisers"
          ),
          where(
            "status",
            "==",
            "pending"
          )
        )
      ),


      /* =========================
         PENDING EVENTS
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "events"
          ),
          where(
            "status",
            "==",
            "pending"
          )
        )
      ),


      /* =========================
         APPROVED MARKETPLACE
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "marketplaceListings"
          ),
          where(
            "status",
            "==",
            "approved"
          )
        )
      ),


      /* =========================
         APPROVED OPPORTUNITIES
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "opportunities"
          ),
          where(
            "status",
            "==",
            "approved"
          )
        )
      ),


      /* =========================
         APPROVED FUNDRAISERS
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "fundraisers"
          ),
          where(
            "status",
            "==",
            "approved"
          )
        )
      ),


      /* =========================
         APPROVED EVENTS
      ========================= */

      getDocs(
        query(
          collection(
            db,
            "events"
          ),
          where(
            "status",
            "==",
            "published"
          )
        )
      ),


      /* =========================
         ARCHIVED CONTENT
      ========================= */

      getDocs(
        collection(
          db,
          "archiveRecords"
        )
      ),


      /* =========================
         REPORTS
      ========================= */

      getDocs(
        collection(
          db,
          "reports"
        )
      )

    ]);


    /* =========================
       TOTAL USERS
    ========================= */

    if (
      totalUsers
    ) {

      totalUsers.textContent =
        usersSnapshot.size;

    }


    /* =========================
       PENDING USERS
    ========================= */

    if (
      pendingUsers
    ) {

      pendingUsers.textContent =
        pendingUsersSnapshot.size;

    }


    /* =========================
       TOTAL PENDING CONTENT
    ========================= */

    const totalPendingContent =
      pendingListingsSnapshot.size +
      pendingOpportunitiesSnapshot.size +
      pendingFundraisersSnapshot.size +
      pendingEventsSnapshot.size;


    if (
      pendingApprovals
    ) {

      pendingApprovals.textContent =
        totalPendingContent;

    }


    /* =========================
       TOTAL APPROVED CONTENT
    ========================= */

    const totalApprovedContent =
      approvedListingsSnapshot.size +
      approvedOpportunitiesSnapshot.size +
      approvedFundraisersSnapshot.size +
      approvedEventsSnapshot.size;


    if (
      approvedContent
    ) {

      approvedContent.textContent =
        totalApprovedContent;

    }


    /* =========================
       ARCHIVED CONTENT
    ========================= */

    if (
      archivedContent
    ) {

      archivedContent.textContent =
        archiveRecordsSnapshot.size;

    }


    /* =========================
       REPORTS
    ========================= */

    if (
      totalReports
    ) {

      totalReports.textContent =
        reportsSnapshot.size;

    }


  } catch (
    error
  ) {

    console.error(
      "Admin statistics error:",
      error
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

if (
  logoutBtn
) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await signOut(
        auth
      );


      window.location.href =
        "/";

    }
  );

}
