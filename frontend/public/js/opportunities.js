import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const opportunityForm =
  document.getElementById("opportunityForm");

const opportunitiesGrid =
  document.getElementById("opportunitiesGrid");

const opportunitySearch =
  document.getElementById("opportunitySearch");

const opportunityCategoryFilter =
  document.getElementById("opportunityCategoryFilter");

let currentUser = null;
let currentUserData = null;
let allOpportunities = [];

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (user) {

    const userSnap =
      await getDoc(
        doc(db, "users", user.uid)
      );

    if (userSnap.exists()) {
      currentUserData =
        userSnap.data();
    }

  }

  if (opportunitiesGrid) {
    await loadOpportunities();
  }

});

/* =========================
   CREATE OPPORTUNITY
========================= */

if (opportunityForm) {

  opportunityForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {
      alert("Please login before posting an opportunity.");
      return;
    }

    const title =
      document.getElementById("opportunityTitle").value.trim();

    const category =
      document.getElementById("opportunityCategory").value;

    const description =
      document.getElementById("opportunityDescription").value.trim();

    const organisation =
      document.getElementById("opportunityOrganisation").value.trim();

    const location =
      document.getElementById("opportunityLocation").value.trim();

    const closingDate =
      document.getElementById("opportunityClosingDate").value;

    const applyLink =
      document.getElementById("opportunityApplyLink").value.trim();

    const contactEmail =
      document.getElementById("opportunityContactEmail").value.trim();

    if (!applyLink && !contactEmail) {
      alert("Please add either an application link or a contact email.");
      return;
    }

    await addDoc(
      collection(db, "opportunities"),
      {
        title,
        category,
        description,
        organisation,
        location,
        closingDate,
        applyLink,
        contactEmail,

        createdBy: currentUser.uid,

        createdByName:
          currentUserData?.fullName ||
          currentUserData?.name ||
          "TalentGoldPlus User",

        status: "pending",
        createdAt: serverTimestamp()
      }
    );

    alert("Opportunity submitted successfully. It will appear once approved.");

    window.location.href =
      "opportunities.html";

  });

}

/* =========================
   LOAD OPPORTUNITIES
========================= */

async function loadOpportunities() {

  opportunitiesGrid.innerHTML =
    "<p>Loading opportunities...</p>";

  const opportunitiesQuery =
    query(
      collection(db, "opportunities"),
      orderBy("createdAt", "desc")
    );

  const snapshot =
    await getDocs(opportunitiesQuery);

  allOpportunities = [];

  snapshot.forEach((opportunityDoc) => {

    const opportunity =
      opportunityDoc.data();
  
    if (opportunity.status !== "approved") return;
  
    /* Hide expired opportunities */
  
    if (
      opportunity.closingDate &&
      new Date(opportunity.closingDate) < new Date()
    ) {
      return;
    }
  
    allOpportunities.push({
      id: opportunityDoc.id,
      ...opportunity
    });
  
  });
  
  renderOpportunities(allOpportunities);

}

/* =========================
   RENDER
========================= */

function renderOpportunities(opportunities) {

  opportunitiesGrid.innerHTML = "";

  if (!opportunities.length) {
    opportunitiesGrid.innerHTML = `
      <div class="empty-state">
        <h2>No Opportunities Yet</h2>
        <p>
          Approved opportunities will appear here once they are submitted and reviewed.
        </p>
        <a href="create-opportunity.html" class="btn-primary">
          Post Opportunity
        </a>
      </div>
    `;
    return;
  }

  opportunities.forEach((opportunity) => {

    const card =
      document.createElement("div");

    card.classList.add("opportunity-card");

    card.innerHTML = `
      <span class="opportunity-category">
        ${formatText(opportunity.category)}
      </span>

      <h3>${opportunity.title}</h3>

      <p class="opportunity-description">
        ${opportunity.description}
      </p>

      <div class="opportunity-meta">

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
          ${formatDate(opportunity.closingDate)}
        </p>

      </div>

      <div class="opportunity-actions">

        ${
          opportunity.applyLink
            ? `
              <a
                href="${opportunity.applyLink}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary"
              >
                Apply Now
              </a>
            `
            : ""
        }

        ${
          opportunity.contactEmail
            ? `
              <a
                href="mailto:${opportunity.contactEmail}"
                class="btn-secondary"
              >
                Contact
              </a>
            `
            : ""
        }

      </div>
    `;

    opportunitiesGrid.appendChild(card);

  });

}

/* =========================
   SEARCH AND FILTER
========================= */

function applyOpportunityFilters() {

  const searchTerm =
    opportunitySearch?.value.toLowerCase().trim() || "";

  const selectedCategory =
    opportunityCategoryFilter?.value || "all";

  const filtered =
    allOpportunities.filter((opportunity) => {

      const matchesSearch =
        opportunity.title?.toLowerCase().includes(searchTerm) ||
        opportunity.description?.toLowerCase().includes(searchTerm) ||
        opportunity.location?.toLowerCase().includes(searchTerm) ||
        opportunity.organisation?.toLowerCase().includes(searchTerm);

      const matchesCategory =
        selectedCategory === "all" ||
        opportunity.category === selectedCategory;

      return matchesSearch && matchesCategory;

    });

  renderOpportunities(filtered);

}

if (opportunitySearch) {
  opportunitySearch.addEventListener("input", applyOpportunityFilters);
}

if (opportunityCategoryFilter) {
  opportunityCategoryFilter.addEventListener("change", applyOpportunityFilters);
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

function formatDate(value) {

  if (!value) {
    return "Not specified";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

}