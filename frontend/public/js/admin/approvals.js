import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const grid =
  document.getElementById("pendingListingsGrid");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href =
      "../auth/login.html";
    return;
  }

  const userSnap =
    await getDoc(
      doc(db, "users", user.uid)
    );

  const userData =
    userSnap.data();

  if (
    userData.role !== "admin" &&
    userData.role !== "superadmin"
  ) {

    alert("Access denied.");

    window.location.href =
      "../pages/dashboard.html";

    return;
  }

  loadPendingListings();

});

async function loadPendingListings() {

  const q = query(
    collection(db, "marketplaceListings"),
    where("status", "==", "pending")
  );

  const snapshot =
    await getDocs(q);

  grid.innerHTML = "";

  if (snapshot.empty) {

    grid.innerHTML =
      "<p>No pending listings.</p>";

    return;
  }

  snapshot.forEach((listingDoc) => {

    const listing =
      listingDoc.data();

    const image =
      listing.listingImage ||
      "../assets/images/TalentGoldPlus.png";

    const card =
      document.createElement("div");

    card.classList.add("approval-card");

    card.innerHTML = `
      <img src="${image}">

      <div class="approval-content">

        <h3>${listing.title}</h3>

        <p>${listing.description}</p>

        <p>
          <strong>Provider:</strong>
          ${listing.userName}
        </p>

        <p>
          <strong>Category:</strong>
          ${listing.category}
        </p>

        <div class="approval-actions">

          <button
            class="approve-btn"
            data-id="${listingDoc.id}">
            Approve
          </button>

          <button
            class="reject-btn"
            data-id="${listingDoc.id}">
            Reject
          </button>

        </div>

      </div>
    `;

    grid.appendChild(card);

  });

  attachButtons();

}

function attachButtons() {

  document
    .querySelectorAll(".approve-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        await updateDoc(
          doc(
            db,
            "marketplaceListings",
            button.dataset.id
          ),
          {
            status: "approved"
          }
        );

        loadPendingListings();

      });

    });

  document
    .querySelectorAll(".reject-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        await updateDoc(
          doc(
            db,
            "marketplaceListings",
            button.dataset.id
          ),
          {
            status: "rejected"
          }
        );

        loadPendingListings();

      });

    });

}