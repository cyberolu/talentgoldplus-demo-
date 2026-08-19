import {
    auth,
    db,
    functions
  } from "../firebase.js";
  
  
  import {
    onAuthStateChanged,
    signOut
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
  
  
  import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
  
  
  import {
    httpsCallable
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";
  
  
  
  const allowedRoles = [
    "admin",
    "superadmin"
  ];
  
  
  const approvedContentGrid =
    document.getElementById(
      "approvedContentGrid"
    );
  
  
  const approvedTotalCount =
    document.getElementById(
      "approvedTotalCount"
    );
  
  
  const approvedMarketplaceCount =
    document.getElementById(
      "approvedMarketplaceCount"
    );
  
  
  const approvedEventsCount =
    document.getElementById(
      "approvedEventsCount"
    );
  
  
  const approvedOpportunitiesCount =
    document.getElementById(
      "approvedOpportunitiesCount"
    );
  
  
  const approvedFundraisersCount =
    document.getElementById(
      "approvedFundraisersCount"
    );
  
  
  const approvedContentSearch =
    document.getElementById(
      "approvedContentSearch"
    );
  
  
  const adminWelcome =
    document.getElementById(
      "adminWelcome"
    );
  
  
  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );
  
  const runLifecycleBtn =
    document.getElementById(
      "runLifecycleBtn"
    );

  let approvedItems = [];
  
  let activeFilter =
    "all";
  
  
  
  /* =========================================================
     AUTH
  ========================================================= */
  
  onAuthStateChanged(
    auth,
    async (user) => {
  
      if (!user) {
  
        window.location.href =
          "../auth/login.html";
  
        return;
  
      }
  
  
      try {
  
        const userReference =
          doc(
            db,
            "users",
            user.uid
          );
  
  
        const userSnapshot =
          await getDoc(
            userReference
          );
  
  
        if (
          !userSnapshot.exists()
        ) {
  
          window.location.href =
            "../pages/dashboard.html";
  
          return;
  
        }
  
  
        const userData =
          userSnapshot.data();
  
  
        const role =
          userData.role ||
          "member";
  
  
        if (
          !allowedRoles.includes(
            role
          )
        ) {
  
          alert(
            "You do not have permission to access this page."
          );
  
  
          window.location.href =
            "../pages/dashboard.html";
  
          return;
  
        }
  
  
        if (
          adminWelcome
        ) {
  
          adminWelcome.textContent =
            `Welcome ${
              userData.name ||
              userData.fullName ||
              "Admin"
            } (${role})`;
  
        }
  
  
        document.body.style.display =
          "block";
  
  
        await loadApprovedContent();
  
  
      } catch (
        error
      ) {
  
        console.error(
          "Approved content access error:",
          error
        );
  
  
        document.body.style.display =
          "block";
  
      }
  
    }
  );
  
  
  
  /* =========================================================
     LOAD APPROVED CONTENT
  ========================================================= */
  
  async function loadApprovedContent() {
  
    if (
      !approvedContentGrid
    ) {
  
      return;
  
    }
  
  
    approvedContentGrid.innerHTML = `
      <p class="approved-content-loading">
        Loading approved content...
      </p>
    `;
  
  
    try {
  
      const [
        marketplaceSnapshot,
        eventsSnapshot,
        opportunitiesSnapshot,
        fundraisersSnapshot
      ] = await Promise.all([
  
  
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
        )
  
      ]);
  
  
      const marketplaceItems =
        marketplaceSnapshot.docs.map(
          (documentSnapshot) => ({
            id:
              documentSnapshot.id,
  
            type:
              "marketplace",
  
            collectionName:
              "marketplaceListings",
  
            ...documentSnapshot.data()
          })
        );
  
  
      const eventItems =
        eventsSnapshot.docs.map(
          (documentSnapshot) => ({
            id:
              documentSnapshot.id,
  
            type:
              "event",
  
            collectionName:
              "events",
  
            ...documentSnapshot.data()
          })
        );
  
  
      const opportunityItems =
        opportunitiesSnapshot.docs.map(
          (documentSnapshot) => ({
            id:
              documentSnapshot.id,
  
            type:
              "opportunity",
  
            collectionName:
              "opportunities",
  
            ...documentSnapshot.data()
          })
        );
  
  
      const fundraiserItems =
        fundraisersSnapshot.docs.map(
          (documentSnapshot) => ({
            id:
              documentSnapshot.id,
  
            type:
              "fundraiser",
  
            collectionName:
              "fundraisers",
  
            ...documentSnapshot.data()
          })
        );
  
  
      approvedItems = [
        ...marketplaceItems,
        ...eventItems,
        ...opportunityItems,
        ...fundraiserItems
      ];
  
  
      approvedItems.sort(
        compareApprovedItems
      );
  
  
      updateSummaryCounts(
        marketplaceItems.length,
        eventItems.length,
        opportunityItems.length,
        fundraiserItems.length
      );
  
  
      renderApprovedItems();
  
  
    } catch (
      error
    ) {
  
      console.error(
        "Approved content load error:",
        error
      );
  
  
      approvedContentGrid.innerHTML = `
        <div class="approved-content-empty">
  
          <h3>
            Unable to load approved content
          </h3>
  
          <p>
            Please check the console for more information.
          </p>
  
        </div>
      `;
  
    }
  
  }
  
  
  
  /* =========================================================
     COUNTS
  ========================================================= */
  
  function updateSummaryCounts(
    marketplaceCount,
    eventsCount,
    opportunitiesCount,
    fundraisersCount
  ) {
  
    const total =
      marketplaceCount +
      eventsCount +
      opportunitiesCount +
      fundraisersCount;
  
  
    if (
      approvedTotalCount
    ) {
  
      approvedTotalCount.textContent =
        total;
  
    }
  
  
    if (
      approvedMarketplaceCount
    ) {
  
      approvedMarketplaceCount.textContent =
        marketplaceCount;
  
    }
  
  
    if (
      approvedEventsCount
    ) {
  
      approvedEventsCount.textContent =
        eventsCount;
  
    }
  
  
    if (
      approvedOpportunitiesCount
    ) {
  
      approvedOpportunitiesCount.textContent =
        opportunitiesCount;
  
    }
  
  
    if (
      approvedFundraisersCount
    ) {
  
      approvedFundraisersCount.textContent =
        fundraisersCount;
  
    }
  
  }
  
  
  
  /* =========================================================
     RENDER
  ========================================================= */
  
  function renderApprovedItems() {
  
    if (
      !approvedContentGrid
    ) {
  
      return;
  
    }
  
  
    const searchValue =
      (
        approvedContentSearch?.value ||
        ""
      )
        .trim()
        .toLowerCase();
  
  
    const filteredItems =
      approvedItems.filter(
        (item) => {
  
          const matchesType =
            activeFilter === "all" ||
            item.type === activeFilter;
  
  
          if (
            !matchesType
          ) {
  
            return false;
  
          }
  
  
          if (
            !searchValue
          ) {
  
            return true;
  
          }
  
  
          const searchableText = [
            getItemTitle(item),
            item.description,
            item.name,
            item.location,
            item.organiser,
            item.organizer,
            item.category,
            item.sport,
            item.userName,
            item.ownerName
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
  
  
          return searchableText.includes(
            searchValue
          );
  
        }
      );
  
  
    if (
      filteredItems.length === 0
    ) {
  
      approvedContentGrid.innerHTML = `
        <div class="approved-content-empty">
  
          <h3>
            No approved content found
          </h3>
  
          <p>
            There are no approved items matching this view.
          </p>
  
        </div>
      `;
  
      return;
  
    }
  
  
    approvedContentGrid.innerHTML =
      filteredItems
        .map(
          createApprovedCard
        )
        .join("");
  
  
    attachApprovedContentActions();
  
  }
  
  
  
  /* =========================================================
     CREATE CARD
  ========================================================= */
  
  function createApprovedCard(
    item
  ) {
  
    const title =
      escapeHtml(
        getItemTitle(
          item
        )
      );
  
  
    const description =
      escapeHtml(
        getItemDescription(
          item
        )
      );
  
  
    const owner =
      escapeHtml(
        item.ownerName ||
        item.userName ||
        item.createdByName ||
        item.organiser ||
        item.organizer ||
        "TalentGoldPlus User"
      );
  
  
    const approvedDate =
      formatTimestamp(
        item.approvedAt ||
        item.updatedAt ||
        item.createdAt
      );
  
  
    const typeLabel =
      getTypeLabel(
        item.type
      );
  
  
    return `
  
      <article
        class="approved-content-card"
        data-item-id="${escapeHtml(item.id)}"
        data-item-type="${escapeHtml(item.type)}"
      >
  
  
        <div class="approved-content-card-top">
  
  
          <span
            class="
              approved-content-type
              approved-type-${escapeHtml(item.type)}
            "
          >
            ${escapeHtml(typeLabel)}
          </span>
  
  
          <span class="approved-content-status">
            Approved
          </span>
  
  
        </div>
  
  
  
        <div class="approved-content-card-body">
  
  
          <h3>
            ${title}
          </h3>
  
  
          <p class="approved-content-description">
            ${description}
          </p>
  
  
          <div class="approved-content-meta">
  
            <p>
              <strong>
                Owner:
              </strong>
  
              ${owner}
            </p>
  
  
            <p>
              <strong>
                Approved:
              </strong>
  
              ${escapeHtml(approvedDate)}
            </p>
  
          </div>
  
  
        </div>
  
  
  
        <div class="approved-content-actions">
  
  
          <a
            href="${getViewUrl(item)}"
            class="approved-view-btn"
          >
            View
          </a>
  
  
          <button
            type="button"
            class="approved-archive-btn"
            data-item-id="${escapeHtml(item.id)}"
            data-collection="${escapeHtml(item.collectionName)}"
            data-item-type="${escapeHtml(item.type)}"
          >
            Archive
          </button>
  
  
        </div>
  
  
      </article>
  
    `;
  
  }
  
  
  
  /* =========================================================
     FILTERS
  ========================================================= */
  
  document
    .querySelectorAll(
      ".approved-filter"
    )
    .forEach(
      (button) => {
  
        button.addEventListener(
          "click",
          () => {
  
            document
              .querySelectorAll(
                ".approved-filter"
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
  
  
            activeFilter =
              button.dataset.filter ||
              "all";
  
  
            renderApprovedItems();
  
          }
        );
  
      }
    );
  
  
  
  /* =========================================================
     SEARCH
  ========================================================= */
  
  if (
    approvedContentSearch
  ) {
  
    approvedContentSearch.addEventListener(
      "input",
      () => {
  
        renderApprovedItems();
  
      }
    );
  
  }
  
  
  
  /* =========================================================
     ACTIONS
  ========================================================= */
  
  function attachApprovedContentActions() {
  
    document
      .querySelectorAll(
        ".approved-archive-btn"
      )
      .forEach(
        (button) => {
  
          button.addEventListener(
            "click",
            async () => {
  
              const itemId =
                button.dataset.itemId;
  
  
              const collectionName =
                button.dataset.collection;
  
  
              const itemType =
                button.dataset.itemType;
  
  
              if (
                !itemId ||
                !collectionName ||
                !itemType
              ) {
  
                return;
  
              }
  
  
              const confirmed =
                confirm(
                  "Archive this approved item?\n\n" +
                  "It will immediately stop appearing as live approved content."
                );
  
  
              if (
                !confirmed
              ) {
  
                return;
  
              }
  
  
              try {
  
                button.disabled =
                  true;
  
  
                button.textContent =
                  "Archiving...";
  
  
                const archiveApprovedContent =
                  httpsCallable(
                    functions,
                    "archiveApprovedContent"
                  );
  
  
                await archiveApprovedContent({
                  itemId,
                  collectionName,
                  itemType
                });
  
  
                approvedItems =
                  approvedItems.filter(
                    (item) =>
                      !(
                        item.id === itemId &&
                        item.collectionName ===
                          collectionName
                      )
                  );
  
  
                updateCountsFromCurrentItems();
  
  
                renderApprovedItems();
  
  
                alert(
                  "Content archived successfully."
                );
  
  
              } catch (
                error
              ) {
  
                console.error(
                  "Archive approved content error:",
                  error
                );
  
  
                alert(
                  error.message ||
                  "Unable to archive this content."
                );
  
  
                button.disabled =
                  false;
  
  
                button.textContent =
                  "Archive";
  
              }
  
            }
          );
  
        }
      );
  
  }
  
  
  
  /* =========================================================
     UPDATE COUNTS AFTER ARCHIVE
  ========================================================= */
  
  function updateCountsFromCurrentItems() {
  
    const marketplaceCount =
      approvedItems.filter(
        (item) =>
          item.type ===
          "marketplace"
      ).length;
  
  
    const eventsCount =
      approvedItems.filter(
        (item) =>
          item.type ===
          "event"
      ).length;
  
  
    const opportunitiesCount =
      approvedItems.filter(
        (item) =>
          item.type ===
          "opportunity"
      ).length;
  
  
    const fundraisersCount =
      approvedItems.filter(
        (item) =>
          item.type ===
          "fundraiser"
      ).length;
  
  
    updateSummaryCounts(
      marketplaceCount,
      eventsCount,
      opportunitiesCount,
      fundraisersCount
    );
  
  }
  
  
  
  /* =========================================================
     HELPERS
  ========================================================= */
  
  function getItemTitle(
    item
  ) {
  
    return (
      item.title ||
      item.name ||
      item.eventName ||
      item.opportunityTitle ||
      item.fundraiserTitle ||
      "Untitled Content"
    );
  
  }
  
  
  function getItemDescription(
    item
  ) {
  
    const description =
      item.description ||
      item.summary ||
      item.details ||
      item.shortDescription ||
      "No description provided.";
  
  
    if (
      description.length >
      180
    ) {
  
      return (
        description.slice(
          0,
          180
        ) +
        "..."
      );
  
    }
  
  
    return description;
  
  }
  
  
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
      "Content"
    );
  
  }
  
  
  function getViewUrl(
    item
  ) {
  
    switch (
      item.type
    ) {
  
      case "marketplace":
  
        return (
          "../pages/marketplace.html"
        );
  
  
      case "event":
  
        return (
          "../pages/events.html"
        );
  
  
      case "opportunity":
  
        return (
          "../pages/opportunities.html"
        );
  
  
      case "fundraiser":
  
        return (
          "../pages/raise-funds.html"
        );
  
  
      default:
  
        return (
          "../pages/dashboard.html"
        );
  
    }
  
  }
  
  
  function formatTimestamp(
    value
  ) {
  
    if (
      !value
    ) {
  
      return "Unknown";
  
    }
  
  
    try {
  
      const date =
        typeof value.toDate ===
        "function"
          ? value.toDate()
          : new Date(value);
  
  
      return date.toLocaleDateString(
        "en-GB",
        {
          day:
            "2-digit",
  
          month:
            "short",
  
          year:
            "numeric"
        }
      );
  
  
    } catch (
      error
    ) {
  
      return "Unknown";
  
    }
  
  }
  
  
  function compareApprovedItems(
    first,
    second
  ) {
  
    const firstDate =
      getTimestampNumber(
        first.approvedAt ||
        first.updatedAt ||
        first.createdAt
      );
  
  
    const secondDate =
      getTimestampNumber(
        second.approvedAt ||
        second.updatedAt ||
        second.createdAt
      );
  
  
    return (
      secondDate -
      firstDate
    );
  
  }
  
  
  function getTimestampNumber(
    value
  ) {
  
    if (
      !value
    ) {
  
      return 0;
  
    }
  
  
    if (
      typeof value.toMillis ===
      "function"
    ) {
  
      return value.toMillis();
  
    }
  
  
    const date =
      new Date(value);
  
  
    return Number.isNaN(
      date.getTime()
    )
      ? 0
      : date.getTime();
  
  }
  
  
  function escapeHtml(
    value = ""
  ) {
  
    return String(
      value
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        "\"",
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  
  }
  
  /* =========================================================
   MANUAL CONTENT LIFECYCLE TEST
========================================================= */

if (
  runLifecycleBtn
) {

  runLifecycleBtn.addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "Run the TalentGoldPlus content lifecycle now?"
        );


      if (
        !confirmed
      ) {

        return;

      }


      try {

        runLifecycleBtn.disabled =
          true;

        runLifecycleBtn.textContent =
          "Running...";


        const runContentLifecycleNow =
          httpsCallable(
            functions,
            "runContentLifecycleNow"
          );


        const result =
          await runContentLifecycleNow();


        console.log(
          "Lifecycle result:",
          result.data
        );


        alert(
          "Content lifecycle completed successfully."
        );


        await loadApprovedContent();


      } catch (
        error
      ) {

        console.error(
          "Lifecycle test failed:",
          error
        );


        alert(
          error.message ||
          "Lifecycle test failed."
        );


      } finally {

        runLifecycleBtn.disabled =
          false;

        runLifecycleBtn.textContent =
          "Run Lifecycle Test";

      }

    }
  );

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
          "../index.html";
  
      }
    );
  
  }