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
    orderBy,
    limit,
    startAfter,
    getDocs,
    doc,
    getDoc
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
  
  
  import {
    httpsCallable
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";
  
  
  const PAGE_SIZE =
    50;
  
  
  const allowedRoles = [
    "admin",
    "superadmin"
  ];
  
  
  const archiveTableBody =
    document.getElementById(
      "archiveTableBody"
    );
  
  
  const archiveVisibleCount =
    document.getElementById(
      "archiveVisibleCount"
    );
  
  
  const archivePageNumber =
    document.getElementById(
      "archivePageNumber"
    );
  
  
  const archivePaginationStatus =
    document.getElementById(
      "archivePaginationStatus"
    );
  
  
  const archivePreviousBtn =
    document.getElementById(
      "archivePreviousBtn"
    );
  
  
  const archiveNextBtn =
    document.getElementById(
      "archiveNextBtn"
    );
  
  
  const archiveSearch =
    document.getElementById(
      "archiveSearch"
    );
  
  
  const rebuildArchiveIndexBtn =
    document.getElementById(
      "rebuildArchiveIndexBtn"
    );
  
  
  const adminWelcome =
    document.getElementById(
      "adminWelcome"
    );
  
  
  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );
  
  
  let currentAdminRole =
    "";
  
  
  let activeType =
    "all";
  
  
  let currentPage =
    1;
  
  
  let currentRecords = [];
  
  
  let lastVisibleDocument =
    null;
  
  
  let pageCursors =
    [];
  
  
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
  
  
      currentAdminRole =
        userData.role ||
        "member";
  
  
      if (
        !allowedRoles.includes(
          currentAdminRole
        )
      ) {
  
        alert(
          "You do not have permission to access archived content."
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
          } (${currentAdminRole})`;
  
      }
  
  
      document.body.style.display =
        "block";
  
  
      await loadArchivePage();
  
    }
  );
  
  
  /* =========================================================
     LOAD PAGE
  ========================================================= */
  
  async function loadArchivePage(
    cursor = null
  ) {
  
    if (
      !archiveTableBody
    ) {
  
      return;
  
    }
  
  
    archiveTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          Loading archived content...
        </td>
      </tr>
    `;
  
  
    try {
  
      const constraints = [];
  
  
      if (
        activeType !==
        "all"
      ) {
  
        constraints.push(
          where(
            "contentType",
            "==",
            activeType
          )
        );
  
      }
  
  
      constraints.push(
        orderBy(
          "archivedAt",
          "desc"
        )
      );
  
  
      if (
        cursor
      ) {
  
        constraints.push(
          startAfter(
            cursor
          )
        );
  
      }
  
  
      /*
        Fetch one extra record so we know
        whether another page exists.
      */
  
      constraints.push(
        limit(
          PAGE_SIZE + 1
        )
      );
  
  
      const snapshot =
        await getDocs(
          query(
            collection(
              db,
              "archiveRecords"
            ),
            ...constraints
          )
        );
  
  
      const documents =
        snapshot.docs;
  
  
      const hasNextPage =
        documents.length >
        PAGE_SIZE;
  
  
      const visibleDocuments =
        hasNextPage
          ? documents.slice(
              0,
              PAGE_SIZE
            )
          : documents;
  
  
      currentRecords =
        visibleDocuments.map(
          (
            documentSnapshot
          ) => ({
            id:
              documentSnapshot.id,
  
            ...documentSnapshot.data()
          })
        );
  
  
      lastVisibleDocument =
        visibleDocuments.length
          ? visibleDocuments[
              visibleDocuments.length - 1
            ]
          : null;
  
  
      renderArchiveTable();
  
  
      archiveNextBtn.disabled =
        !hasNextPage;
  
  
      archivePreviousBtn.disabled =
        currentPage === 1;
  
  
      updatePaginationText();
  
  
    } catch (
      error
    ) {
  
      console.error(
        "Archive loading error:",
        error
      );
  
  
      archiveTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            Unable to load archived content.
            Check the browser console.
          </td>
        </tr>
      `;
  
    }
  
  }
  
  
  /* =========================================================
     RENDER TABLE
  ========================================================= */
  
  function renderArchiveTable() {
  
    const searchValue =
      (
        archiveSearch?.value ||
        ""
      )
        .trim()
        .toLowerCase();
  
  
    const records =
      currentRecords.filter(
        (record) => {
  
          if (
            !searchValue
          ) {
  
            return true;
  
          }
  
  
          const searchableText = [
            record.title,
            record.ownerName,
            record.contentType,
            record.archiveReason
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
      archiveVisibleCount
    ) {
  
      archiveVisibleCount.textContent =
        records.length;
  
    }
  
  
    if (
      !records.length
    ) {
  
      archiveTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No archived content found on this page.
          </td>
        </tr>
      `;
  
      return;
  
    }
  
  
    archiveTableBody.innerHTML =
      records
        .map(
          createArchiveRow
        )
        .join("");
  
  
    attachArchiveActions();
  
  }
  
  
  /* =========================================================
     ROW
  ========================================================= */
  
  function createArchiveRow(
    record
  ) {
  
    const restoreAllowed =
      record.archiveReason ===
        "manual_admin_archive";
  
  
    return `
  
      <tr>
  
        <td>
          <span class="archive-type-badge">
            ${escapeHtml(
              getTypeLabel(
                record.contentType
              )
            )}
          </span>
        </td>
  
  
        <td>
  
          <strong>
            ${escapeHtml(
              record.title ||
              "Untitled Content"
            )}
          </strong>
  
          <small>
            ${escapeHtml(
              record.itemId ||
              ""
            )}
          </small>
  
        </td>
  
  
        <td>
          ${escapeHtml(
            record.ownerName ||
            "Unknown"
          )}
        </td>
  
  
        <td>
          ${formatTimestamp(
            record.archivedAt
          )}
        </td>
  
  
        <td>
          ${escapeHtml(
            getReasonLabel(
              record.archiveReason
            )
          )}
        </td>
  
  
        <td>
          ${formatTimestamp(
            record.deleteAt
          )}
        </td>
  
  
        <td>
  
          <div class="archive-actions">
  
            ${
              restoreAllowed
                ? `
                  <button
                    type="button"
                    class="archive-restore-btn"
                    data-record-id="${escapeAttribute(record.id)}"
                  >
                    Restore
                  </button>
                `
                : `
                  <span class="archive-expired-label">
                    Expired
                  </span>
                `
            }
  
  
            ${
              currentAdminRole ===
                "superadmin"
                ? `
                  <button
                    type="button"
                    class="archive-delete-btn"
                    data-record-id="${escapeAttribute(record.id)}"
                  >
                    Delete
                  </button>
                `
                : ""
            }
  
          </div>
  
        </td>
  
      </tr>
  
    `;
  
  }
  
  
  /* =========================================================
     FILTER
  ========================================================= */
  
  document
    .querySelectorAll(
      ".archive-filter"
    )
    .forEach(
      (button) => {
  
        button.addEventListener(
          "click",
          async () => {
  
            document
              .querySelectorAll(
                ".archive-filter"
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
  
  
            activeType =
              button.dataset.filter ||
              "all";
  
  
            currentPage =
              1;
  
  
            pageCursors =
              [];
  
  
            lastVisibleDocument =
              null;
  
  
            await loadArchivePage();
  
          }
        );
  
      }
    );
  
  
  /* =========================================================
     SEARCH CURRENT PAGE
  ========================================================= */
  
  if (
    archiveSearch
  ) {
  
    archiveSearch.addEventListener(
      "input",
      renderArchiveTable
    );
  
  }
  
  
  /* =========================================================
     NEXT
  ========================================================= */
  
  if (
    archiveNextBtn
  ) {
  
    archiveNextBtn.addEventListener(
      "click",
      async () => {
  
        if (
          !lastVisibleDocument
        ) {
  
          return;
  
        }
  
  
        pageCursors[
          currentPage
        ] =
          lastVisibleDocument;
  
  
        currentPage +=
          1;
  
  
        await loadArchivePage(
          pageCursors[
            currentPage - 1
          ]
        );
  
      }
    );
  
  }
  
  
  /* =========================================================
     PREVIOUS
  ========================================================= */
  
  if (
    archivePreviousBtn
  ) {
  
    archivePreviousBtn.addEventListener(
      "click",
      async () => {
  
        if (
          currentPage <=
          1
        ) {
  
          return;
  
        }
  
  
        currentPage -=
          1;
  
  
        const cursor =
          currentPage ===
            1
            ? null
            : pageCursors[
                currentPage - 1
              ];
  
  
        await loadArchivePage(
          cursor
        );
  
      }
    );
  
  }
  
  
  /* =========================================================
     PAGINATION TEXT
  ========================================================= */
  
  function updatePaginationText() {
  
    if (
      archivePageNumber
    ) {
  
      archivePageNumber.textContent =
        currentPage;
  
    }
  
  
    if (
      archivePaginationStatus
    ) {
  
      archivePaginationStatus.textContent =
        `Page ${currentPage}`;
  
    }
  
  }
  
  
  /* =========================================================
     ACTIONS
  ========================================================= */
  
  function attachArchiveActions() {
  
    document
      .querySelectorAll(
        ".archive-restore-btn"
      )
      .forEach(
        (button) => {
  
          button.addEventListener(
            "click",
            async () => {
  
              const recordId =
                button.dataset.recordId;
  
  
              const confirmed =
                confirm(
                  "Restore this archived content?"
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
                  "Restoring...";
  
  
                const restoreArchivedContent =
                  httpsCallable(
                    functions,
                    "restoreArchivedContent"
                  );
  
  
                await restoreArchivedContent({
                  recordId
                });
  
  
                await loadArchivePage(
                  currentPage === 1
                    ? null
                    : pageCursors[
                        currentPage - 1
                      ]
                );
  
  
              } catch (
                error
              ) {
  
                console.error(
                  "Restore error:",
                  error
                );
  
  
                alert(
                  error.message ||
                  "Unable to restore content."
                );
  
  
                button.disabled =
                  false;
  
  
                button.textContent =
                  "Restore";
  
              }
  
            }
          );
  
        }
      );
  
  
    document
      .querySelectorAll(
        ".archive-delete-btn"
      )
      .forEach(
        (button) => {
  
          button.addEventListener(
            "click",
            async () => {
  
              const recordId =
                button.dataset.recordId;
  
  
              const confirmed =
                confirm(
                  "Permanently delete this archived item?\n\nThis cannot be undone."
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
                  "Deleting...";
  
  
                const deleteArchivedContent =
                  httpsCallable(
                    functions,
                    "deleteArchivedContent"
                  );
  
  
                await deleteArchivedContent({
                  recordId
                });
  
  
                await loadArchivePage(
                  currentPage === 1
                    ? null
                    : pageCursors[
                        currentPage - 1
                      ]
                );
  
  
              } catch (
                error
              ) {
  
                console.error(
                  "Delete archive error:",
                  error
                );
  
  
                alert(
                  error.message ||
                  "Unable to delete content."
                );
  
  
                button.disabled =
                  false;
  
  
                button.textContent =
                  "Delete";
  
              }
  
            }
          );
  
        }
      );
  
  }
  
  
  /* =========================================================
     REBUILD ARCHIVE INDEX
  ========================================================= */
  
  if (
    rebuildArchiveIndexBtn
  ) {
  
    rebuildArchiveIndexBtn.addEventListener(
      "click",
      async () => {
  
        if (
          currentAdminRole !==
          "superadmin"
        ) {
  
          alert(
            "Only a superadmin can rebuild the archive index."
          );
  
          return;
  
        }
  
  
        const confirmed =
          confirm(
            "Scan existing archived content and rebuild the archive index?"
          );
  
  
        if (
          !confirmed
        ) {
  
          return;
  
        }
  
  
        try {
  
          rebuildArchiveIndexBtn.disabled =
            true;
  
  
          rebuildArchiveIndexBtn.textContent =
            "Rebuilding...";
  
  
          const rebuildArchiveIndex =
            httpsCallable(
              functions,
              "rebuildArchiveIndex"
            );
  
  
          const result =
            await rebuildArchiveIndex();
  
  
          alert(
            `Archive index rebuilt. ${result.data.indexed} records indexed.`
          );
  
  
          currentPage =
            1;
  
  
          pageCursors =
            [];
  
  
          await loadArchivePage();
  
  
        } catch (
          error
        ) {
  
          console.error(
            "Archive index rebuild error:",
            error
          );
  
  
          alert(
            error.message ||
            "Unable to rebuild archive index."
          );
  
  
        } finally {
  
          rebuildArchiveIndexBtn.disabled =
            false;
  
  
          rebuildArchiveIndexBtn.textContent =
            "Rebuild Archive Index";
  
        }
  
      }
    );
  
  }
  
  
  /* =========================================================
     HELPERS
  ========================================================= */
  
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
  
  
    return labels[type] ||
      "Content";
  
  }
  
  
  function getReasonLabel(
    reason
  ) {
  
    const labels = {
  
      manual_admin_archive:
        "Archived by admin",
  
      event_expired:
        "Event ended",
  
      opportunity_expired:
        "Opportunity closed",
  
      fundraiser_expired:
        "Fundraiser ended",
  
      marketplace_expired:
        "Marketplace expired"
  
    };
  
  
    return labels[reason] ||
      reason ||
      "Archived";
  
  }
  
  
  function formatTimestamp(
    value
  ) {
  
    if (
      !value
    ) {
  
      return "—";
  
    }
  
  
    try {
  
      const date =
        typeof value.toDate ===
          "function"
          ? value.toDate()
          : new Date(
              value
            );
  
  
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
  
      return "—";
  
    }
  
  }
  
  
  function escapeHtml(
    value = ""
  ) {
  
    const element =
      document.createElement(
        "div"
      );
  
  
    element.textContent =
      String(
        value
      );
  
  
    return element.innerHTML;
  
  }
  
  
  function escapeAttribute(
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