import {
    auth,
    db
  } from "../firebase.js";
  
  import {
    onAuthStateChanged
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
  
  import {
    collection,
    query,
    where,
    getDocs
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
  
  
  /* =========================
     PAGE ELEMENTS
  ========================= */
  
  const marketplaceGrid =
    document.getElementById(
      "marketplaceSubmissions"
    );
  
  const eventGrid =
    document.getElementById(
      "eventSubmissions"
    );
  
  const opportunityGrid =
    document.getElementById(
      "opportunitySubmissions"
    );
  
  const fundraiserGrid =
    document.getElementById(
      "fundraiserSubmissions"
    );
  
  
  const totalSubmissionCount =
    document.getElementById(
      "totalSubmissionCount"
    );
  
  const totalApprovedCount =
    document.getElementById(
      "totalApprovedCount"
    );
  
  const totalPendingCount =
    document.getElementById(
      "totalPendingCount"
    );
  
  const totalRejectedCount =
    document.getElementById(
      "totalRejectedCount"
    );

   const totalArchivedCount =
    document.getElementById(
      "totalArchivedCount"
    );
  
  
  /* =========================
     STATE
  ========================= */
  
  let allSubmissions = [];
  
  let currentFilter =
    "all";
  
  
  /* =========================
     AUTH
  ========================= */
  
  onAuthStateChanged(
    auth,
    async (user) => {
  
      if (!user) {
        return;
      }
  
      await loadAllSubmissions(
        user.uid
      );
  
      document.body.style.display =
        "block";
  
    }
  );
  
  
  /* =========================
     LOAD EVERYTHING
  ========================= */
  
  async function loadAllSubmissions(
    userId
  ) {
  
    try {
  
      const [
        marketplaceSnapshot,
        eventsSnapshot,
        opportunitiesSnapshot,
        fundraisersSnapshot
      ] = await Promise.all([
  
  
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

      allSubmissions = [];
  
  
      marketplaceSnapshot.forEach(
        (documentSnapshot) => {
  
          allSubmissions.push({
            id:
              documentSnapshot.id,
  
            type:
              "marketplace",
  
            data:
              documentSnapshot.data()
          });
  
        }
      );
  
  
      eventsSnapshot.forEach(
        (documentSnapshot) => {
  
          allSubmissions.push({
            id:
              documentSnapshot.id,
  
            type:
              "event",
  
            data:
              documentSnapshot.data()
          });
  
        }
      );
  
  
      opportunitiesSnapshot.forEach(
        (documentSnapshot) => {
  
          allSubmissions.push({
            id:
              documentSnapshot.id,
  
            type:
              "opportunity",
  
            data:
              documentSnapshot.data()
          });
  
        }
      );
  
  
      fundraisersSnapshot.forEach(
        (documentSnapshot) => {
  
          allSubmissions.push({
            id:
              documentSnapshot.id,
  
            type:
              "fundraiser",
  
            data:
              documentSnapshot.data()
          });
  
        }
      );
  
  
      sortSubmissions();
  
      updateSummary();
  
      renderAllSections();
  
    } catch (error) {
  
      console.error(
        "My submissions loading error:",
        error
      );
  
  
      if (marketplaceGrid) {
  
        marketplaceGrid.innerHTML =
          errorMessage();
  
      }
  
      if (eventGrid) {
  
        eventGrid.innerHTML =
          errorMessage();
  
      }
  
      if (opportunityGrid) {
  
        opportunityGrid.innerHTML =
          errorMessage();
  
      }
  
      if (fundraiserGrid) {
  
        fundraiserGrid.innerHTML =
          errorMessage();
  
      }
  
    }
  
  }
  
  
  /* =========================
     SORT
  ========================= */
  
  function sortSubmissions() {
  
    allSubmissions.sort(
      (a, b) => {
  
        const dateA =
          getTimestamp(
            a.data.createdAt
          );
  
        const dateB =
          getTimestamp(
            b.data.createdAt
          );
  
        return (
          dateB -
          dateA
        );
  
      }
    );
  
  }
  
  
  /* =========================
     SUMMARY
  ========================= */
  
  function updateSummary() {
  
    let approved =
      0;
  
    let pending =
      0;
  
    let rejected =
      0;
    
    let archived =
      0;
  
    allSubmissions.forEach(
      (submission) => {
  
        const status =
          normaliseStatus(
            submission.data.status
          );
  
  
        if (
          status === "approved"
        ) {
  
          approved += 1;
  
        }
  
  
        if (
          status === "pending"
        ) {
  
          pending += 1;
  
        }
  
  
        if (
          status === "rejected"
        ) {
  
          rejected += 1;
  
        }

        if (
          status === "archived"
        ) {
        
          archived += 1;
        
        }
  
      }
    );
  
  
    if (totalSubmissionCount) {
  
      totalSubmissionCount.textContent =
        allSubmissions.length;
  
    }
  
  
    if (totalApprovedCount) {
  
      totalApprovedCount.textContent =
        approved;
  
    }
  
  
    if (totalPendingCount) {
  
      totalPendingCount.textContent =
        pending;
  
    }
  
  
    if (totalRejectedCount) {
  
      totalRejectedCount.textContent =
        rejected;
  
    }
  
    if (totalArchivedCount) {

      totalArchivedCount.textContent =
        archived;
    
    }
  }
  
  
  /* =========================
     RENDER ALL
  ========================= */
  
  function renderAllSections() {
  
    renderSubmissionType(
      "marketplace",
      marketplaceGrid
    );
  
    renderSubmissionType(
      "event",
      eventGrid
    );
  
    renderSubmissionType(
      "opportunity",
      opportunityGrid
    );
  
    renderSubmissionType(
      "fundraiser",
      fundraiserGrid
    );
  
  }
  
  
  /* =========================
     RENDER TYPE
  ========================= */
  
  function renderSubmissionType(
    type,
    container
  ) {
  
    if (!container) {
      return;
    }
  
  
    const submissions =
      allSubmissions.filter(
        (submission) => {
  
          if (
            submission.type !==
            type
          ) {
  
            return false;
  
          }
  
  
          if (
            currentFilter ===
            "all"
          ) {
  
            return true;
  
          }
  
  
          return (
            normaliseStatus(
              submission.data.status
            ) === currentFilter
          );
  
        }
      );
  
  
    container.innerHTML =
      "";
  
  
    if (
      submissions.length ===
      0
    ) {
  
      container.innerHTML = `
        <div class="submission-empty">
          <h3>No submissions here</h3>
          <p>
            ${
              currentFilter === "all"
                ? "You have not submitted anything in this category yet."
                : `You have no ${currentFilter} submissions in this category.`
            }
          </p>
        </div>
      `;
  
      return;
    }
  
  
    submissions.forEach(
      (submission) => {
  
        container.appendChild(
          createSubmissionCard(
            submission
          )
        );
  
      }
    );
  
  }
  
  
  /* =========================
     CREATE CARD
  ========================= */
  
  function createSubmissionCard(
    submission
  ) {
  
    const {
      type,
      id,
      data
    } = submission;
  
  
    const status =
      normaliseStatus(
        data.status
      );
  
  
    const card =
      document.createElement(
        "article"
      );
  
  
    card.className =
      `my-submission-card submission-${status}`;
  
  
    const title =
      data.title ||
      data.name ||
      "Untitled Submission";
  
  
    const description =
      getDescription(
        type,
        data
      );
  
  
    const image =
      getSubmissionImage(
        type,
        data
      );
  
  
    const createdDate =
      formatDate(
        data.createdAt
      );
  
  
    const statusLabel =
      getStatusLabel(
        status
      );
  
  
    const rejectionReason =
      data.rejectionReason ||
      data.reason ||
      "";
  
  
    card.innerHTML = `
  
      ${
        image
          ? `
            <div class="my-submission-image-wrap">
  
              <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                class="my-submission-image"
                onerror="this.closest('.my-submission-image-wrap').style.display='none'"
              >
  
            </div>
          `
          : ""
      }
  
  
      <div class="my-submission-body">
  
  
        <div class="my-submission-top">
  
          <span
            class="submission-status-badge ${status}"
          >
            ${statusLabel}
          </span>
  
          <span class="submission-type-label">
            ${getTypeLabel(type)}
          </span>
  
        </div>
  
  
        <h3>
          ${escapeHtml(title)}
        </h3>
  
  
        ${
          description
            ? `
              <p class="submission-description">
                ${escapeHtml(description)}
              </p>
            `
            : ""
        }
  
  
        <div class="submission-meta">
  
          ${
            createdDate
              ? `
                <span>
                  Submitted ${createdDate}
                </span>
              `
              : ""
          }
  
        </div>
  
  
        ${
          status === "pending"
            ? `
              <div class="submission-status-message pending-message">
  
                <strong>
                  Awaiting review
                </strong>
  
                <p>
                  Your submission has been received and is waiting for approval.
                </p>
  
              </div>
            `
            : ""
        }
  
  
        ${
          status === "approved"
            ? `
              <div class="submission-status-message approved-message">
  
                <strong>
                  Approved
                </strong>
  
                <p>
                  This submission has been approved by TalentGoldPlus.
                </p>
  
              </div>
            `
            : ""
        }
  
  
        ${
          status === "rejected"
            ? `
              <div class="submission-status-message rejected-message">
  
                <strong>
                  Not approved
                </strong>
  
                <p>
                  ${
                    rejectionReason
                      ? `Reason: ${escapeHtml(rejectionReason)}`
                      : "Please contact TalentGoldPlus if you need more information."
                  }
                </p>
  
              </div>
            `
            : ""
        }
  
        ${
          status === "archived"
            ? `
              <div class="submission-status-message archived-message">
        
                <strong>
                  Archived
                </strong>
        
                <p>
                  ${
                    data.archiveReason === "fundraiser_expired"
                      ? "This fundraiser has ended and has been automatically archived."
                      : data.archiveReason === "event_expired"
                        ? "This event has ended and has been automatically archived."
                        : data.archiveReason === "opportunity_expired"
                          ? "This opportunity has closed and has been automatically archived."
                          : data.archiveReason === "marketplace_expired"
                            ? "This Marketplace listing expired and has been archived."
                            : "This submission is no longer live and has been archived."
                  }
                </p>
        
              </div>
            `
            : ""
        }
        
        
        ${
          status === "expired"
            ? `
              <div class="submission-status-message expired-message">
        
                <strong>
                  Expired
                </strong>
        
                <p>
                  This submission has expired and is no longer live.
                </p>
        
              </div>
            `
            : ""
        }
        <div class="submission-card-actions">
  
          ${getActionLink(
            type,
            id,
            status
          )}
  
        </div>
  
  
      </div>
    `;
  
  
    return card;
  
  }
  
  
  /* =========================
     STATUS
  ========================= */
  
  function normaliseStatus(
    value
  ) {
  
    const status =
      (
        value ||
        "pending"
      )
        .toString()
        .trim()
        .toLowerCase();
  
  
    /* APPROVED / LIVE */
  
    if (
      status === "published" ||
      status === "active" ||
      status === "approved"
    ) {
  
      return "approved";
  
    }
  
  
    /* REJECTED */
  
    if (
      status === "rejected" ||
      status === "declined"
    ) {
  
      return "rejected";
  
    }
  
  
    /* ARCHIVED */
  
    if (
      status === "archived"
    ) {
  
      return "archived";
  
    }
  
  
    /* EXPIRED */
  
    if (
      status === "expired"
    ) {
  
      return "expired";
  
    }
  
  
    /* PENDING */
  
    if (
      status === "pending" ||
      status === "under-review"
    ) {
  
      return "pending";
  
    }
  
  
    /*
      Unknown statuses should not
      accidentally be treated as pending.
    */
  
    return status;
  
  }
  
  
  /* =========================
     STATUS LABEL
  ========================= */
  
  function getStatusLabel(
    status
  ) {
  
    if (
      status === "approved"
    ) {
  
      return "Approved";
  
    }
  
  
    if (
      status === "rejected"
    ) {
  
      return "Rejected";
  
    }
  
  
    if (
      status === "archived"
    ) {
  
      return "Archived";
  
    }
  
  
    if (
      status === "expired"
    ) {
  
      return "Expired";
  
    }
  
  
    return "Pending Review";
  
  }
  

  /* =========================
     TYPE LABEL
  ========================= */
  
  function getTypeLabel(
    type
  ) {
  
    const labels = {
      marketplace:
        "Marketplace",
  
      event:
        "Event",
  
      opportunity:
        "Opportunity",
  
      fundraiser:
        "Fundraiser"
    };
  
  
    return (
      labels[type] ||
      "Submission"
    );
  
  }
  
  
  /* =========================
     DESCRIPTION
  ========================= */
  
  function getDescription(
    type,
    data
  ) {
  
    if (
      type === "fundraiser"
    ) {
  
      return (
        data.story ||
        data.description ||
        ""
      );
  
    }
  
  
    if (
      type === "event"
    ) {
  
      return (
        data.summary ||
        data.description ||
        ""
      );
  
    }
  
  
    return (
      data.description ||
      ""
    );
  
  }
  
  
  /* =========================
     IMAGE
  ========================= */
  
  function getSubmissionImage(
    type,
    data
  ) {
  
    if (
      type === "marketplace"
    ) {
  
      return (
        data.listingImage ||
        ""
      );
  
    }
  
  
    if (
      type === "event"
    ) {
  
      return (
        data.imageUrl ||
        data.eventImage ||
        ""
      );
  
    }
  
  
    if (
      type === "fundraiser"
    ) {
  
      return (
        data.fundraiserImage ||
        data.imageUrl ||
        ""
      );
  
    }
  
  
    if (
      type === "opportunity"
    ) {
  
      return (
        data.imageUrl ||
        data.opportunityImage ||
        ""
      );
  
    }
  
  
    return "";
  
  }
  
  
  /* =========================
     ACTION LINK
  ========================= */
  
  function getActionLink(
    type,
    id,
    status
  ) {
  
    const encodedId =
      encodeURIComponent(id);
  
/* =========================
   ARCHIVED
========================= */

if (
  status === "archived"
) {

  return "";

}


/* =========================
   EXPIRED
========================= */

if (
  status === "expired"
) {

  if (
    type === "marketplace"
  ) {

    return `
      <a
        href="/create-listing?edit=${encodedId}"
        class="submission-view-btn"
      >
        Renew Listing
      </a>
    `;

  }


  return `
    <span class="submission-archived-label">
      Expired
    </span>
  `;

}
  
    /* =========================
       PENDING / REJECTED
    ========================= */
  
    if (
      status === "pending" ||
      status === "rejected"
    ) {
  
      const buttonText =
        status === "rejected"
          ? "Edit & Resubmit"
          : "Edit Submission";
  
  
      if (
        type === "marketplace"
      ) {
  
        return `
          <a
            href="/create-listing?edit=${encodedId}"
            class="submission-view-btn"
          >
            ${buttonText}
          </a>
        `;
  
      }
  
  
      if (
        type === "event"
      ) {
  
        return `
          <a
            href="/create-event?edit=${encodedId}"
            class="submission-view-btn"
          >
            ${buttonText}
          </a>
        `;
  
      }
  
  
      if (
        type === "opportunity"
      ) {
  
        return `
          <a
            href="/create-opportunity?edit=${encodedId}"
            class="submission-view-btn"
          >
            ${buttonText}
          </a>
        `;
  
      }
  
  
      if (
        type === "fundraiser"
      ) {
  
        return `
          <a
            href="/create-fundraiser?edit=${encodedId}"
            class="submission-view-btn"
          >
            ${buttonText}
          </a>
        `;
  
      }
  
    }
  
  
    /* =========================
       APPROVED
    ========================= */
  
    if (
      type === "event"
    ) {
  
      return `
        <a
          href="/event-details?id=${encodedId}"
          class="submission-view-btn"
        >
          View Event
        </a>
      `;
  
    }
  
  
    if (
      type === "marketplace"
    ) {
  
      return `
        <a
          href="/marketplace"
          class="submission-view-btn"
        >
          View Marketplace
        </a>
      `;
  
    }
  
  
    if (
      type === "opportunity"
    ) {
  
      return `
        <a
          href="/opportunities"
          class="submission-view-btn"
        >
          View Opportunity
        </a>
      `;
  
    }
  
  
    if (
      type === "fundraiser"
    ) {
  
      return `
        <a
          href="/fundraiser-details?id=${encodedId}"
          class="submission-view-btn"
        >
          View Fundraiser
        </a>
      `;
  
    }
  
  
    return "";
  
  }
  
  
  /* =========================
     FILTERS
  ========================= */
  
  document
    .querySelectorAll(
      ".submission-filter"
    )
    .forEach(
      (button) => {
  
        button.addEventListener(
          "click",
          () => {
  
            currentFilter =
              button.dataset.filter ||
              "all";
  
  
            document
              .querySelectorAll(
                ".submission-filter"
              )
              .forEach(
                (filterButton) => {
  
                  filterButton.classList.remove(
                    "active"
                  );
  
                }
              );
  
  
            button.classList.add(
              "active"
            );
  
  
            renderAllSections();
  
          }
        );
  
      }
    );
  
  
  /* =========================
     TIMESTAMP
  ========================= */
  
  function getTimestamp(
    value
  ) {
  
    if (
      value?.toDate
    ) {
  
      return (
        value
          .toDate()
          .getTime()
      );
  
    }
  
  
    if (
      value instanceof Date
    ) {
  
      return value.getTime();
  
    }
  
  
    return 0;
  
  }
  
  
  /* =========================
     DATE FORMAT
  ========================= */
  
  function formatDate(
    value
  ) {
  
    if (!value) {
      return "";
    }
  
  
    let date =
      null;
  
  
    if (
      value?.toDate
    ) {
  
      date =
        value.toDate();
  
    } else if (
      value instanceof Date
    ) {
  
      date =
        value;
  
    }
  
  
    if (!date) {
      return "";
    }
  
  
    return date.toLocaleDateString(
      "en-GB",
      {
        day:
          "numeric",
  
        month:
          "short",
  
        year:
          "numeric"
      }
    );
  
  }
  
  
  /* =========================
     ESCAPE HTML
  ========================= */
  
  function escapeHtml(
    value = ""
  ) {
  
    const element =
      document.createElement(
        "div"
      );
  
  
    element.textContent =
      String(value);
  
  
    return element.innerHTML;
  
  }
  
  
  /* =========================
     ESCAPE ATTRIBUTE
  ========================= */
  
  function escapeAttribute(
    value = ""
  ) {
  
    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "\"",
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#39;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      );
  
  }
  
  
  /* =========================
     ERROR MESSAGE
  ========================= */
  
  function errorMessage() {
  
    return `
      <div class="submission-empty">
        <h3>Unable to load submissions</h3>
        <p>
          Please refresh the page and try again.
        </p>
      </div>
    `;
  
  }
