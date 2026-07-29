import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const communityOpportunities =
  document.getElementById(
    "communityOpportunities"
  );

async function loadCommunityOpportunities() {

  if (!communityOpportunities) {
    return;
  }

  communityOpportunities.innerHTML = `
    <p class="community-opportunities-loading">
      Loading opportunities...
    </p>
  `;

  try {

    const opportunitiesQuery =
      query(
        collection(db, "opportunities"),
        orderBy("createdAt", "desc")
      );

    const snapshot =
      await getDocs(opportunitiesQuery);

    const approvedOpportunities = [];

    snapshot.forEach((opportunityDoc) => {

      const opportunity =
        opportunityDoc.data();

      if (
        opportunity.status !== "approved"
      ) {
        return;
      }

      if (
        opportunity.closingDate &&
        isExpired(opportunity.closingDate)
      ) {
        return;
      }

      approvedOpportunities.push({
        id: opportunityDoc.id,
        ...opportunity
      });

    });

    const latestOpportunities =
      approvedOpportunities.slice(0, 3);

    renderCommunityOpportunities(
      latestOpportunities
    );

  } catch (error) {

    console.error(
      "Unable to load community opportunities:",
      error
    );

    communityOpportunities.innerHTML = `
      <p class="community-opportunities-empty">
        Opportunities could not be loaded.
      </p>
    `;

  }

}

function renderCommunityOpportunities(
  opportunities
) {

  communityOpportunities.innerHTML = "";

  if (!opportunities.length) {

    communityOpportunities.innerHTML = `
      <div class="community-opportunities-empty">
        <p>
          No opportunities are available at the moment.
        </p>
      </div>
    `;

    return;

  }

  opportunities.forEach((opportunity) => {

    const opportunityLink =
      document.createElement("a");

    opportunityLink.href =
      "opportunities.html";

    opportunityLink.className =
      "community-opportunity-item";

    opportunityLink.innerHTML = `
      <span class="community-opportunity-category">
        ${escapeHTML(
          formatText(
            opportunity.category
          )
        )}
      </span>

      <strong>
        ${escapeHTML(
          opportunity.title ||
          "Opportunity"
        )}
      </strong>

      <span class="community-opportunity-date">
        ${
          opportunity.closingDate
            ? `Closes ${escapeHTML(
                formatDate(
                  opportunity.closingDate
                )
              )}`
            : "Closing date not specified"
        }
      </span>
    `;

    communityOpportunities.appendChild(
      opportunityLink
    );

  });

}

function isExpired(value) {

  const closingDate =
    new Date(`${value}T23:59:59`);

  const today =
    new Date();

  return closingDate < today;

}

function formatText(value) {

  return (
    value ||
    "General"
  )
    .toString()
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );

}

function formatDate(value) {

  if (!value) {
    return "Not specified";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );

}

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

loadCommunityOpportunities();