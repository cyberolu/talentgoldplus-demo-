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

const listingsGrid =
  document.getElementById("pendingListingsGrid");

const opportunitiesGrid =
  document.getElementById("pendingOpportunitiesGrid");

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

  if (!userSnap.exists()) {
    window.location.href =
      "../pages/dashboard.html";
    return;
  }

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

  document.body.style.display = "block";

  await loadPendingListings();
  await loadPendingOpportunities();

});

/* =========================
   MARKETPLACE APPROVALS
========================= */

async function loadPendingListings() {

  const q = query(
    collection(db, "marketplaceListings"),
    where("status", "==", "pending")
  );

  const snapshot =
    await getDocs(q);

  listingsGrid.innerHTML = "";

  if (snapshot.empty) {
    listingsGrid.innerHTML =
      "<p>No pending marketplace listings.</p>";
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
      <img src="${image}" alt="${listing.title}">

      <div class="approval-content">

        <h3>${listing.title}</h3>

        <p>${listing.description}</p>

        <p>
          <strong>Provider:</strong>
          ${listing.userName || "TalentGoldPlus User"}
        </p>

        <p>
          <strong>Category:</strong>
          ${formatText(listing.category)}
        </p>

        <div class="approval-actions">

          <button
            class="approve-listing-btn"
            data-id="${listingDoc.id}">
            Approve
          </button>

          <button
            class="reject-listing-btn"
            data-id="${listingDoc.id}">
            Reject
          </button>

        </div>

      </div>
    `;

    listingsGrid.appendChild(card);

  });

  attachListingButtons();

}

function attachListingButtons() {

  document
    .querySelectorAll(".approve-listing-btn")
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

        await loadPendingListings();

      });

    });

  document
    .querySelectorAll(".reject-listing-btn")
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

        await loadPendingListings();

      });

    });

}

/* =========================
   OPPORTUNITY APPROVALS
========================= */

async function loadPendingOpportunities() {

  const q = query(
    collection(db, "opportunities"),
    where("status", "==", "pending")
  );

  const snapshot =
    await getDocs(q);

  opportunitiesGrid.innerHTML = "";

  if (snapshot.empty) {
    opportunitiesGrid.innerHTML =
      "<p>No pending opportunities.</p>";
    return;
  }

  snapshot.forEach((opportunityDoc) => {

    const opportunity =
      opportunityDoc.data();

    const card =
      document.createElement("div");

    card.classList.add("approval-card");

    card.innerHTML = `
      <div class="approval-content">

        <h3>${opportunity.title}</h3>

        <p>${opportunity.description}</p>

        <p>
          <strong>Category:</strong>
          ${formatText(opportunity.category)}
        </p>

        <p>
          <strong>Organisation:</strong>
          ${opportunity.organisation || "Not specified"}
        </p>

        <p>
          <strong>Location:</strong>
          ${opportunity.location || "Online / Not specified"}
        </p>

        <p>
          <strong>Closing Date:</strong>
          ${opportunity.closingDate || "Not specified"}
        </p>

        <p>
          <strong>Submitted By:</strong>
          ${opportunity.createdByName || "TalentGoldPlus User"}
        </p>

        <div class="approval-actions">

          <button
            class="approve-opportunity-btn"
            data-id="${opportunityDoc.id}">
            Approve
          </button>

          <button
            class="reject-opportunity-btn"
            data-id="${opportunityDoc.id}">
            Reject
          </button>

        </div>

      </div>
    `;

    opportunitiesGrid.appendChild(card);

  });

  attachOpportunityButtons();

}

function attachOpportunityButtons() {

  document
    .querySelectorAll(".approve-opportunity-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        await updateDoc(
          doc(
            db,
            "opportunities",
            button.dataset.id
          ),
          {
            status: "approved"
          }
        );

        await loadPendingOpportunities();

      });

    });

  document
    .querySelectorAll(".reject-opportunity-btn")
    .forEach((button) => {

      button.addEventListener("click", async () => {

        await updateDoc(
          doc(
            db,
            "opportunities",
            button.dataset.id
          ),
          {
            status: "rejected"
          }
        );

        await loadPendingOpportunities();

      });

    });

}

/* =========================
   HELPERS
========================= */

function formatText(value) {

  return (value || "General")
    .toString()
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

}