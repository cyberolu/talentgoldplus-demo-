import {
  auth,
  db
} from "../firebase.js";

import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


/* =========================
   CLOUD FUNCTIONS
========================= */

const functions =
  getFunctions(
    undefined,
    "europe-west2"
  );

if (
  window.location.hostname ===
    "127.0.0.1" ||
  window.location.hostname ===
    "localhost"
) {

  connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    5001
  );

}


const approveEventFunction =
  httpsCallable(
    functions,
    "approveEvent"
  );

const rejectEventFunction =
  httpsCallable(
    functions,
    "rejectEvent"
  );

const approveListingFunction =
  httpsCallable(
    functions,
    "approveListing"
  );

const rejectListingFunction =
  httpsCallable(
    functions,
    "rejectListing"
  );

const approveOpportunityFunction =
  httpsCallable(
    functions,
    "approveOpportunity"
  );

const rejectOpportunityFunction =
  httpsCallable(
    functions,
    "rejectOpportunity"
  );

const approveFundraiserFunction =
  httpsCallable(
    functions,
    "approveFundraiser"
  );

const rejectFundraiserFunction =
  httpsCallable(
    functions,
    "rejectFundraiser"
  );


/* =========================
   PAGE ELEMENTS
========================= */

const listingsGrid =
  document.getElementById(
    "pendingListingsGrid"
  );

const opportunitiesGrid =
  document.getElementById(
    "pendingOpportunitiesGrid"
  );

const fundraisersGrid =
  document.getElementById(
    "pendingFundraisersGrid"
  );

const eventsGrid =
  document.getElementById(
    "pendingEventsGrid"
  );


/* =========================
   ADMIN ACCESS
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../auth/login.html";

      return;
    }

    const userSnap =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
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

      alert(
        "Access denied."
      );

      window.location.href =
        "../pages/dashboard.html";

      return;
    }

    document.body.style.display =
      "block";

    await loadPendingListings();
    await loadPendingOpportunities();
    await loadPendingFundraisers();
    await loadPendingEvents();

  }
);


/* =========================
   MARKETPLACE
========================= */

async function loadPendingListings() {

  const q =
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
    );

  const snapshot =
    await getDocs(q);

  listingsGrid.innerHTML = "";

  if (snapshot.empty) {

    listingsGrid.innerHTML =
      "<p>No pending marketplace listings.</p>";

    return;
  }

  snapshot.forEach(
    (listingDoc) => {

      const listing =
        listingDoc.data();

      const image =
        listing.listingImage ||
        "../assets/images/TalentGoldPlus.png";

      const card =
        document.createElement(
          "div"
        );

      card.classList.add(
        "approval-card"
      );

      card.innerHTML = `
        <img
          src="${image}"
          alt="${listing.title || "Listing"}"
        >

        <div class="approval-content">

          <h3>
            ${listing.title || "Untitled Listing"}
          </h3>

          <p>
            ${listing.description || ""}
          </p>

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

      listingsGrid.appendChild(
        card
      );

    }
  );

  attachListingButtons();
}


function attachListingButtons() {

  document
    .querySelectorAll(
      ".approve-listing-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          await runApprovalAction(
            button,
            "Approving...",
            approveListingFunction,
            {
              listingId:
                button.dataset.id
            },
            loadPendingListings
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".reject-listing-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const reason =
            requestRejectionReason();

          if (!reason) {
            return;
          }

          await runApprovalAction(
            button,
            "Rejecting...",
            rejectListingFunction,
            {
              listingId:
                button.dataset.id,
              reason
            },
            loadPendingListings
          );

        }
      );

    });

}


/* =========================
   OPPORTUNITIES
========================= */

async function loadPendingOpportunities() {

  const q =
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
    );

  const snapshot =
    await getDocs(q);

  opportunitiesGrid.innerHTML =
    "";

  if (snapshot.empty) {

    opportunitiesGrid.innerHTML =
      "<p>No pending opportunities.</p>";

    return;
  }

  snapshot.forEach(
    (opportunityDoc) => {

      const opportunity =
        opportunityDoc.data();

      const card =
        document.createElement(
          "div"
        );

      card.classList.add(
        "approval-card"
      );

      card.innerHTML = `
        <div class="approval-content">

          <h3>
            ${opportunity.title || "Untitled Opportunity"}
          </h3>

          <p>
            ${opportunity.description || ""}
          </p>

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

      opportunitiesGrid.appendChild(
        card
      );

    }
  );

  attachOpportunityButtons();
}


function attachOpportunityButtons() {

  document
    .querySelectorAll(
      ".approve-opportunity-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          await runApprovalAction(
            button,
            "Approving...",
            approveOpportunityFunction,
            {
              opportunityId:
                button.dataset.id
            },
            loadPendingOpportunities
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".reject-opportunity-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const reason =
            requestRejectionReason();

          if (!reason) {
            return;
          }

          await runApprovalAction(
            button,
            "Rejecting...",
            rejectOpportunityFunction,
            {
              opportunityId:
                button.dataset.id,
              reason
            },
            loadPendingOpportunities
          );

        }
      );

    });

}


/* =========================
   FUNDRAISERS
========================= */

async function loadPendingFundraisers() {

  const q =
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
    );

  const snapshot =
    await getDocs(q);

  fundraisersGrid.innerHTML =
    "";

  if (snapshot.empty) {

    fundraisersGrid.innerHTML =
      "<p>No pending fundraisers.</p>";

    return;
  }

  snapshot.forEach(
    (fundraiserDoc) => {

      const fundraiser =
        fundraiserDoc.data();

      const image =
        fundraiser.fundraiserImage ||
        "../assets/images/TalentGoldPlus.png";

      const card =
        document.createElement(
          "div"
        );

      card.classList.add(
        "approval-card"
      );

      card.innerHTML = `
        <img
          src="${image}"
          alt="${fundraiser.title || "Fundraiser"}"
        >

        <div class="approval-content">

          <h3>
            ${fundraiser.title || "Untitled Fundraiser"}
          </h3>

          <p>
            ${fundraiser.story || "No story provided."}
          </p>

          <p>
            <strong>Purpose:</strong>
            ${formatText(fundraiser.purpose)}
          </p>

          <p>
            <strong>Sport:</strong>
            ${fundraiser.sport || "Not specified"}
          </p>

          <p>
            <strong>Target:</strong>
            £${Number(
              fundraiser.targetAmount || 0
            ).toLocaleString()}
          </p>

          <p>
            <strong>Deadline:</strong>
            ${fundraiser.deadline || "Not specified"}
          </p>

          <p>
            <strong>Submitted By:</strong>
            ${fundraiser.createdByName || "TalentGoldPlus User"}
          </p>

          <div class="approval-actions">

            <button
              class="approve-fundraiser-btn"
              data-id="${fundraiserDoc.id}">
              Approve
            </button>

            <button
              class="reject-fundraiser-btn"
              data-id="${fundraiserDoc.id}">
              Reject
            </button>

          </div>

        </div>
      `;

      fundraisersGrid.appendChild(
        card
      );

    }
  );

  attachFundraiserButtons();
}


function attachFundraiserButtons() {

  document
    .querySelectorAll(
      ".approve-fundraiser-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          await runApprovalAction(
            button,
            "Approving...",
            approveFundraiserFunction,
            {
              fundraiserId:
                button.dataset.id
            },
            loadPendingFundraisers
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".reject-fundraiser-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const reason =
            requestRejectionReason();

          if (!reason) {
            return;
          }

          await runApprovalAction(
            button,
            "Rejecting...",
            rejectFundraiserFunction,
            {
              fundraiserId:
                button.dataset.id,
              reason
            },
            loadPendingFundraisers
          );

        }
      );

    });

}


/* =========================
   EVENTS
========================= */

async function loadPendingEvents() {

  if (!eventsGrid) {
    return;
  }

  const q =
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
    );

  const snapshot =
    await getDocs(q);

  eventsGrid.innerHTML =
    "";

  if (snapshot.empty) {

    eventsGrid.innerHTML =
      "<p>No pending events.</p>";

    return;
  }

  snapshot.forEach(
    (eventDoc) => {

      const event =
        eventDoc.data();

      const image =
        event.imageUrl ||
        "../assets/images/TalentGoldPlus.png";

      const startDate =
        event.startDate?.toDate
          ? event.startDate.toDate()
          : null;

      const formattedDate =
        startDate
          ? startDate.toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "long",
                year: "numeric"
              }
            )
          : "Not specified";

      const location =
        event.isOnline
          ? "Online"
          : [
              event.venueName,
              event.town,
              event.country
            ]
              .filter(Boolean)
              .join(", ") ||
            "Not specified";

      const card =
        document.createElement(
          "div"
        );

      card.classList.add(
        "approval-card"
      );

      card.innerHTML = `
        <img
          src="${image}"
          alt="${event.title || "Event"}"
        >

        <div class="approval-content">

          <h3>
            ${event.title || "Untitled Event"}
          </h3>

          <p>
            ${
              event.summary ||
              event.description ||
              "No description provided."
            }
          </p>

          <p>
            <strong>Category:</strong>
            ${formatText(event.category)}
          </p>

          <p>
            <strong>Sport:</strong>
            ${formatText(event.sport)}
          </p>

          <p>
            <strong>Date:</strong>
            ${formattedDate}
          </p>

          <p>
            <strong>Location:</strong>
            ${location}
          </p>

          <p>
            <strong>Organiser:</strong>
            ${
              event.organiserName ||
              event.organiserEmail ||
              "TalentGoldPlus User"
            }
          </p>

          <div class="approval-actions">

            <button
              class="approve-event-btn"
              data-id="${eventDoc.id}">
              Approve
            </button>

            <button
              class="reject-event-btn"
              data-id="${eventDoc.id}">
              Reject
            </button>

          </div>

        </div>
      `;

      eventsGrid.appendChild(
        card
      );

    }
  );

  attachEventButtons();
}


function attachEventButtons() {

  document
    .querySelectorAll(
      ".approve-event-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          await runApprovalAction(
            button,
            "Approving...",
            approveEventFunction,
            {
              eventId:
                button.dataset.id
            },
            loadPendingEvents
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".reject-event-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const reason =
            requestRejectionReason();

          if (!reason) {
            return;
          }

          await runApprovalAction(
            button,
            "Rejecting...",
            rejectEventFunction,
            {
              eventId:
                button.dataset.id,
              reason
            },
            loadPendingEvents
          );

        }
      );

    });

}


/* =========================
   SHARED APPROVAL ACTION
========================= */

async function runApprovalAction(
  button,
  loadingText,
  cloudFunction,
  payload,
  reloadFunction
) {

  const originalText =
    button.textContent;

  try {

    button.disabled =
      true;

    button.textContent =
      loadingText;

    await cloudFunction(
      payload
    );

    await reloadFunction();

  } catch (error) {

    console.error(
      "Approval action failed:",
      error
    );

    alert(
      error?.message ||
      "Unable to complete this action."
    );

    button.disabled =
      false;

    button.textContent =
      originalText;

  }

}


/* =========================
   REJECTION REASON
========================= */

function requestRejectionReason() {

  const response =
    window.prompt(
      "Please enter the reason for rejection:"
    );

  if (response === null) {
    return null;
  }

  const reason =
    response.trim();

  if (!reason) {

    alert(
      "A rejection reason is required."
    );

    return null;
  }

  return reason;
}


/* =========================
   TEXT FORMATTER
========================= */

function formatText(value) {

  return (
    value ||
    "General"
  )
    .toString()
    .replaceAll(
      "-",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

}