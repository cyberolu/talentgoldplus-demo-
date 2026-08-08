import { auth, db } from "../firebase.js";

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
  document.getElementById("adminWelcome");

const totalUsers =
  document.getElementById("totalUsers");

const pendingApprovals =
  document.getElementById("pendingApprovals");

const approvedListings =
  document.getElementById("approvedListings");

const totalReports =
  document.getElementById("totalReports");

const logoutBtn =
  document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  const userRef =
    doc(db, "users", user.uid);

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {
    window.location.href = "../pages/dashboard.html";
    return;
  }

  const userData =
    userSnap.data();

  const role =
    userData.role || "member";

  if (!allowedRoles.includes(role)) {
    alert("You do not have permission to access the admin panel.");
    window.location.href = "../pages/dashboard.html";
    return;
  }

  document.body.style.display = "block";
  
  adminWelcome.textContent =
    `Welcome ${userData.name || userData.fullName || "Admin"} (${role})`;

  await loadAdminStats();

});

async function loadAdminStats() {

  const usersSnapshot =
    await getDocs(collection(db, "users"));

  totalUsers.textContent =
    usersSnapshot.size;

  const [
    pendingListingsSnapshot,
    pendingOpportunitiesSnapshot,
    pendingFundraisersSnapshot,
    pendingEventsSnapshot
  ] = await Promise.all([
    getDocs(
      query(
        collection(db, "marketplaceListings"),
        where("status", "==", "pending")
      )
    ),

    getDocs(
      query(
        collection(db, "opportunities"),
        where("status", "==", "pending")
      )
    ),

    getDocs(
      query(
        collection(db, "fundraisers"),
        where("status", "==", "pending")
      )
    ),

    getDocs(
      query(
        collection(db, "events"),
        where("status", "==", "pending")
      )
    )
  ]);

  const totalPendingApprovals =
    pendingListingsSnapshot.size +
    pendingOpportunitiesSnapshot.size +
    pendingFundraisersSnapshot.size +
    pendingEventsSnapshot.size;

  pendingApprovals.textContent =
    totalPendingApprovals;

  const approvedQuery =
    query(
      collection(db, "marketplaceListings"),
      where("status", "==", "approved")
    );

  const approvedSnapshot =
    await getDocs(approvedQuery);

  approvedListings.textContent =
    approvedSnapshot.size;

  try {

    const reportsSnapshot =
      await getDocs(collection(db, "reports"));

    totalReports.textContent =
      reportsSnapshot.size;

  } catch (error) {

    totalReports.textContent =
      "0";

  }

}

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href =
      "../index.html";

  });

}