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
  getDocs,
  doc,
  getDoc,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";


const moderateReportFunction =
  httpsCallable(
    functions,
    "moderateReport"
  );


const deleteReportFunction =
  httpsCallable(
    functions,
    "deleteReport"
  );


const allowedRoles = [
  "admin",
  "superadmin"
];


const reportsGrid =
  document.getElementById(
    "reportsGrid"
  );


const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


const adminWelcome =
  document.getElementById(
    "adminWelcome"
  );


const reportsTotalCount =
  document.getElementById(
    "reportsTotalCount"
  );


const reportsOpenCount =
  document.getElementById(
    "reportsOpenCount"
  );


const reportsAppealedCount =
  document.getElementById(
    "reportsAppealedCount"
  );


const reportsResolvedCount =
  document.getElementById(
    "reportsResolvedCount"
  );


const reportsDismissedCount =
  document.getElementById(
    "reportsDismissedCount"
  );


const reportSearch =
  document.getElementById(
    "reportSearch"
  );


let currentUserRole =
  null;


let currentFilter =
  "all";


let reports =
  [];


/* =========================
   AUTH
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../auth/login.html";

      return;

    }


    const userSnapshot =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );


    if (!userSnapshot.exists()) {

      window.location.href =
        "../pages/dashboard.html";

      return;

    }


    const userData =
      userSnapshot.data();


    currentUserRole =
      userData.role ||
      "athlete";


    if (
      !allowedRoles.includes(
        currentUserRole
      )
    ) {

      alert(
        "You do not have permission to access Reports."
      );


      window.location.href =
        "../pages/dashboard.html";

      return;

    }


    if (adminWelcome) {

      adminWelcome.textContent =
        `Welcome ${
          userData.name ||
          userData.fullName ||
          "Admin"
        } (${currentUserRole})`;

    }


    document.body.style.display =
      "block";


    await loadReports();

  }
);


/* =========================
   LOAD REPORTS
========================= */

async function loadReports() {

  if (!reportsGrid) {
    return;
  }


  reportsGrid.innerHTML = `
    <p>
      Loading reports...
    </p>
  `;


  try {

    const reportsQuery =
      query(
        collection(
          db,
          "reports"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(
        reportsQuery
      );


    reports =
      snapshot.docs.map(
        (reportDocument) => ({
          id:
            reportDocument.id,

          ...reportDocument.data()
        })
      );


    updateReportSummary();

    renderReports();


  } catch (error) {

    console.error(
      "Reports loading error:",
      error
    );


    reportsGrid.innerHTML = `
      <div class="submission-empty">

        <h3>
          Unable to load reports
        </h3>

        <p>
          Please check the browser console.
        </p>

      </div>
    `;

  }

}


/* =========================
   SUMMARY
========================= */

function updateReportSummary() {

  let open = 0;
  let appealed = 0;
  let resolved = 0;
  let dismissed = 0;


  reports.forEach(
    (report) => {

      const status =
        normaliseReportStatus(
          report.status
        );


      if (status === "open") {
        open += 1;
      }


      if (status === "appealed") {
        appealed += 1;
      }


      if (status === "resolved") {
        resolved += 1;
      }


      if (status === "dismissed") {
        dismissed += 1;
      }

    }
  );


  if (reportsTotalCount) {

    reportsTotalCount.textContent =
      reports.length;

  }


  if (reportsOpenCount) {

    reportsOpenCount.textContent =
      open;

  }


  if (reportsAppealedCount) {

    reportsAppealedCount.textContent =
      appealed;

  }


  if (reportsResolvedCount) {

    reportsResolvedCount.textContent =
      resolved;

  }


  if (reportsDismissedCount) {

    reportsDismissedCount.textContent =
      dismissed;

  }

}


/* =========================
   RENDER
========================= */

function renderReports() {

  if (!reportsGrid) {
    return;
  }


  const searchValue =
    (
      reportSearch?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const filteredReports =
    reports.filter(
      (report) => {

        const status =
          normaliseReportStatus(
            report.status
          );


        if (
          currentFilter !== "all" &&
          status !== currentFilter
        ) {

          return false;

        }


        if (!searchValue) {
          return true;
        }


        const searchableText = [
          report.reason,
          report.type,
          report.reportedPostAuthor,
          report.reportedPostText,
          report.reportedByName,
          report.reportedBy,
          report.status,
          report.resolution,
          report.moderatorNote,
          report.appealReason,
          report.appealDecision
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
    filteredReports.length === 0
  ) {

    reportsGrid.innerHTML = `
      <div class="submission-empty">

        <h3>
          No reports found
        </h3>

        <p>
          There are no reports matching this view.
        </p>

      </div>
    `;

    return;

  }


  reportsGrid.innerHTML =
    filteredReports
      .map(
        createReportCard
      )
      .join("");


  attachReportEvents();

}


/* =========================
   REPORT CARD
========================= */

function createReportCard(
  report
) {

  const status =
    normaliseReportStatus(
      report.status
    );


  const mediaHtml =
    report.reportedPostMedia
      ? `
        <img
          src="${escapeAttribute(
            report.reportedPostMedia
          )}"
          alt="Reported content"
          class="reported-media"
        >
      `
      : "";


  const createdAt =
    formatTimestamp(
      report.createdAt
    );


  const resolvedAt =
    formatTimestamp(
      report.resolvedAt
    );


  const appealSubmittedAt =
    formatTimestamp(
      report.appealSubmittedAt
    );


  const appealReviewedAt =
    formatTimestamp(
      report.appealReviewedAt
    );


  return `

    <article class="report-card">


      <div class="report-card-header">

        <div>

          <span class="report-type-label">

            ${escapeHtml(
              formatReportType(
                report.type
              )
            )}

          </span>


          <h3>

            ${escapeHtml(
              report.reportedPostAuthor ||
              "Reported Content"
            )}

          </h3>

        </div>


        <span
          class="report-status report-status-${status}"
        >

          ${escapeHtml(
            getStatusLabel(
              status
            )
          )}

        </span>

      </div>


      <div class="report-details">


        <p>

          <strong>
            Report Reason:
          </strong>

          ${escapeHtml(
            report.reason ||
            "No reason provided"
          )}

        </p>


        ${
          createdAt
            ? `
              <p>

                <strong>
                  Reported:
                </strong>

                ${createdAt}

              </p>
            `
            : ""
        }


        <p>

          <strong>
            Reported By:
          </strong>

          ${escapeHtml(
            report.reportedByName ||
            report.reportedBy ||
            "Unknown"
          )}

        </p>


      </div>


      <div class="reported-content-box">

        <p>
          <strong>
            Reported Content
          </strong>
        </p>

        <p>

          ${escapeHtml(
            report.reportedPostText ||
            "No text content."
          )}

        </p>

        ${mediaHtml}

      </div>


      ${
        report.moderatorNote
          ? `
            <div class="report-resolution-box">

              <strong>
                Moderator Action
              </strong>

              <p>
                ${escapeHtml(
                  report.moderatorNote
                )}
              </p>

              ${
                resolvedAt
                  ? `
                    <small>
                      Actioned ${resolvedAt}
                    </small>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }


      ${
        report.appealStatus === "pending"
          ? `
            <div class="report-resolution-box">

              <strong>
                User Appeal
              </strong>

              <p>
                ${escapeHtml(
                  report.appealReason ||
                  "No appeal reason provided."
                )}
              </p>

              ${
                appealSubmittedAt
                  ? `
                    <small>
                      Submitted ${appealSubmittedAt}
                    </small>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }


      ${
        report.appealStatus === "accepted" ||
        report.appealStatus === "rejected"
          ? `
            <div class="report-resolution-box">

              <strong>
                Appeal Decision
              </strong>

              <p>
                ${
                  report.appealStatus === "accepted"
                    ? "Appeal accepted"
                    : "Original decision upheld"
                }
              </p>

              ${
                report.appealDecision
                  ? `
                    <p>
                      ${escapeHtml(
                        report.appealDecision
                      )}
                    </p>
                  `
                  : ""
              }

              ${
                appealReviewedAt
                  ? `
                    <small>
                      Reviewed ${appealReviewedAt}
                    </small>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }


      <div class="report-actions">


        ${
          status === "appealed" &&
          report.appealStatus === "pending"
            ? `

              <button
                type="button"
                class="
                  report-action-btn
                  accept-appeal-btn
                "
                data-id="${escapeAttribute(
                  report.id
                )}"
              >
                Accept Appeal
              </button>


              <button
                type="button"
                class="
                  report-action-btn
                  reject-appeal-btn
                "
                data-id="${escapeAttribute(
                  report.id
                )}"
              >
                Uphold Decision
              </button>

            `
            : ""
        }


        ${
          status === "open"
            ? `

              <button
                type="button"
                class="
                  report-action-btn
                  resolve-report-btn
                "
                data-id="${escapeAttribute(
                  report.id
                )}"
              >
                Resolve
              </button>


              <button
                type="button"
                class="
                  report-action-btn
                  dismiss-report-btn
                "
                data-id="${escapeAttribute(
                  report.id
                )}"
              >
                Dismiss
              </button>


              ${
                report.itemId
                  ? `
                    <button
                      type="button"
                      class="
                        report-action-btn
                        hide-post-btn
                      "
                      data-id="${escapeAttribute(
                        report.id
                      )}"
                    >
                      Hide Post
                    </button>
                  `
                  : ""
              }

            `
            : ""
        }


        ${
          report.itemId &&
          report.resolution === "post_hidden" &&
          report.appealStatus !== "pending"
            ? `
              <button
                type="button"
                class="
                  report-action-btn
                  restore-post-btn
                "
                data-id="${escapeAttribute(
                  report.id
                )}"
              >
                Restore Post
              </button>
            `
            : ""
        }


        ${
          currentUserRole === "superadmin"
            ? `
              <button
                type="button"
                class="
                  report-action-btn
                  delete-report-btn
                "
                data-id="${escapeAttribute(
                  report.id
                )}"
              >
                Delete Report
              </button>
            `
            : ""
        }


      </div>


    </article>

  `;

}


/* =========================
   ACTION EVENTS
========================= */

function attachReportEvents() {


  /* ACCEPT APPEAL */

  document
    .querySelectorAll(
      ".accept-appeal-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              await chooseModerationReason({

                title:
                  "Accept Appeal",

                message:
                  "Select why the moderation decision should be reversed.",

                confirmLabel:
                  "Accept Appeal",

                reasons: [
                  "Appeal accepted",
                  "No violation found",
                  "Content reviewed and cleared",
                  "Moderation decision reconsidered",
                  "New information provided",
                  "Other"
                ]

              });


            if (!reason) {
              return;
            }


            const confirmed =
              confirm(
                "Accept this appeal and restore the post?"
              );


            if (!confirmed) {
              return;
            }


            await runModerationAction(
              button,
              button.dataset.id,
              "accept_appeal",
              reason
            );

          }
        );

      }
    );


  /* UPHOLD DECISION */

  document
    .querySelectorAll(
      ".reject-appeal-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              await chooseModerationReason({

                title:
                  "Uphold Decision",

                message:
                  "Select why the original moderation decision should remain.",

                confirmLabel:
                  "Uphold Decision",

                reasons: [
                  "Original decision remains valid",
                  "Content breaches platform rules",
                  "Appeal provides no new evidence",
                  "Safety concern remains",
                  "Privacy concern remains",
                  "Other"
                ]

              });


            if (!reason) {
              return;
            }


            const confirmed =
              confirm(
                "Uphold the original moderation decision?"
              );


            if (!confirmed) {
              return;
            }


            await runModerationAction(
              button,
              button.dataset.id,
              "reject_appeal",
              reason
            );

          }
        );

      }
    );


  /* RESOLVE */

  document
    .querySelectorAll(
      ".resolve-report-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              await chooseModerationReason({

                title:
                  "Resolve Report",

                message:
                  "Select the outcome of this review.",

                confirmLabel:
                  "Resolve Report",

                reasons: [
                  "Reviewed - no further action required",
                  "User contacted",
                  "Warning issued",
                  "Content already removed",
                  "Duplicate report",
                  "Matter resolved",
                  "Other"
                ]

              });


            if (!reason) {
              return;
            }


            await runModerationAction(
              button,
              button.dataset.id,
              "resolve",
              reason
            );

          }
        );

      }
    );


  /* DISMISS */

  document
    .querySelectorAll(
      ".dismiss-report-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              await chooseModerationReason({

                title:
                  "Dismiss Report",

                message:
                  "Select why this report is being dismissed.",

                confirmLabel:
                  "Dismiss Report",

                reasons: [
                  "No violation found",
                  "Insufficient evidence",
                  "Duplicate report",
                  "Report submitted in error",
                  "Content does not breach platform rules",
                  "Unable to verify complaint",
                  "Other"
                ]

              });


            if (!reason) {
              return;
            }


            await runModerationAction(
              button,
              button.dataset.id,
              "dismiss",
              reason
            );

          }
        );

      }
    );


  /* HIDE POST */

  document
    .querySelectorAll(
      ".hide-post-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              await chooseModerationReason({

                title:
                  "Hide Post",

                message:
                  "Select why this content should be hidden.",

                confirmLabel:
                  "Hide Post",

                reasons: [
                  "Under investigation",
                  "Harassment or bullying",
                  "Hate or abusive content",
                  "Spam or misleading content",
                  "Inappropriate content",
                  "Safety concern",
                  "Privacy concern",
                  "Suspected scam or fraud",
                  "Impersonation",
                  "Other"
                ]

              });


            if (!reason) {
              return;
            }


            const confirmed =
              confirm(
                "Hide this post from the TalentGoldPlus community?"
              );


            if (!confirmed) {
              return;
            }


            await runModerationAction(
              button,
              button.dataset.id,
              "hide_post",
              reason
            );

          }
        );

      }
    );


  /* RESTORE POST */

  document
    .querySelectorAll(
      ".restore-post-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reason =
              await chooseModerationReason({

                title:
                  "Restore Post",

                message:
                  "Select why this content is being restored.",

                confirmLabel:
                  "Restore Post",

                reasons: [
                  "Investigation completed",
                  "No violation found",
                  "Issue corrected",
                  "Content reviewed and cleared",
                  "Post hidden in error",
                  "Other"
                ]

              });


            if (!reason) {
              return;
            }


            const confirmed =
              confirm(
                "Restore this post to the TalentGoldPlus community?"
              );


            if (!confirmed) {
              return;
            }


            await runModerationAction(
              button,
              button.dataset.id,
              "restore_post",
              reason
            );

          }
        );

      }
    );


  /* DELETE */

  document
    .querySelectorAll(
      ".delete-report-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reportId =
              button.dataset.id;


            if (
              currentUserRole !==
              "superadmin"
            ) {

              alert(
                "Only superadmins can permanently delete reports."
              );

              return;

            }


            const confirmed =
              confirm(
                "Permanently delete this report?\n\nThis cannot be undone."
              );


            if (!confirmed) {
              return;
            }


            try {

              button.disabled =
                true;


              button.textContent =
                "Deleting...";


              await deleteReportFunction({
                reportId
              });


              await loadReports();


            } catch (error) {

              console.error(
                "Report deletion error:",
                error
              );


              alert(
                error?.message ||
                "Unable to delete this report."
              );


              await loadReports();

            }

          }
        );

      }
    );

}


/* =========================
   MODERATION MODAL
========================= */

async function chooseModerationReason({
  title,
  message,
  confirmLabel,
  reasons
}) {

  return new Promise(
    (resolve) => {

      const overlay =
        document.createElement(
          "div"
        );


      overlay.className =
        "moderation-modal-overlay";


      overlay.innerHTML = `

        <div class="moderation-modal">

          <h3>
            ${escapeHtml(title)}
          </h3>

          <p>
            ${escapeHtml(message)}
          </p>

          <label
            for="moderationReasonSelect"
          >
            Moderation reason
          </label>

          <select
            id="moderationReasonSelect"
            class="moderation-reason-select"
          >

            <option value="">
              Select a reason
            </option>

            ${
              reasons
                .map(
                  (reason) => `
                    <option
                      value="${escapeAttribute(
                        reason
                      )}"
                    >
                      ${escapeHtml(
                        reason
                      )}
                    </option>
                  `
                )
                .join("")
            }

          </select>


          <textarea
            id="moderationOtherReason"
            class="moderation-other-reason"
            placeholder="Enter the moderation reason..."
            style="display: none;"
          ></textarea>


          <div class="moderation-modal-actions">

            <button
              type="button"
              id="moderationCancelBtn"
              class="moderation-cancel-btn"
            >
              Cancel
            </button>

            <button
              type="button"
              id="moderationConfirmBtn"
              class="moderation-confirm-btn"
            >
              ${escapeHtml(
                confirmLabel
              )}
            </button>

          </div>

        </div>
      `;


      document.body.appendChild(
        overlay
      );


      const select =
        overlay.querySelector(
          "#moderationReasonSelect"
        );


      const otherReason =
        overlay.querySelector(
          "#moderationOtherReason"
        );


      const cancelButton =
        overlay.querySelector(
          "#moderationCancelBtn"
        );


      const confirmButton =
        overlay.querySelector(
          "#moderationConfirmBtn"
        );


      function closeModal(
        value = ""
      ) {

        overlay.remove();

        resolve(
          value
        );

      }


      select.addEventListener(
        "change",
        () => {

          if (
            select.value === "Other"
          ) {

            otherReason.style.display =
              "block";

            otherReason.focus();

          } else {

            otherReason.style.display =
              "none";

            otherReason.value =
              "";

          }

        }
      );


      cancelButton.addEventListener(
        "click",
        () => {

          closeModal();

        }
      );


      confirmButton.addEventListener(
        "click",
        () => {

          let reason =
            select.value;


          if (
            reason === "Other"
          ) {

            reason =
              otherReason.value.trim();

          }


          if (!reason) {

            alert(
              "Please select or enter a moderation reason."
            );

            return;

          }


          closeModal(
            reason
          );

        }
      );


      overlay.addEventListener(
        "click",
        (event) => {

          if (
            event.target === overlay
          ) {

            closeModal();

          }

        }
      );

    }
  );

}


/* =========================
   RUN ACTION
========================= */

async function runModerationAction(
  button,
  reportId,
  action,
  note = ""
) {

  if (!reportId) {
    return;
  }


  try {

    button.disabled =
      true;


    button.textContent =
      "Processing...";


    await moderateReportFunction({

      reportId,

      action,

      note

    });


    await loadReports();


  } catch (error) {

    console.error(
      "Report moderation error:",
      error
    );


    alert(
      error?.message ||
      "Unable to complete this moderation action."
    );


    await loadReports();

  }

}


/* =========================
   FILTERS
========================= */

document
  .querySelectorAll(
    ".report-filter"
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
              ".report-filter"
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


          renderReports();

        }
      );

    }
  );


if (reportSearch) {

  reportSearch.addEventListener(
    "input",
    renderReports
  );

}


/* =========================
   STATUS
========================= */

function normaliseReportStatus(
  value
) {

  const status =
    (
      value ||
      "open"
    )
      .toString()
      .trim()
      .toLowerCase();


  if (
    status === "appealed"
  ) {

    return "appealed";

  }


  if (
    status === "resolved"
  ) {

    return "resolved";

  }


  if (
    status === "dismissed"
  ) {

    return "dismissed";

  }


  return "open";

}


function getStatusLabel(
  status
) {

  if (
    status === "appealed"
  ) {

    return "Appeal Pending";

  }


  if (
    status === "resolved"
  ) {

    return "Resolved";

  }


  if (
    status === "dismissed"
  ) {

    return "Dismissed";

  }


  return "Open";

}


/* =========================
   TYPE
========================= */

function formatReportType(
  type
) {

  if (!type) {
    return "Report";
  }


  return type
    .split("_")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");

}


/* =========================
   DATE
========================= */

function formatTimestamp(
  value
) {

  if (!value) {
    return "";
  }


  try {

    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);


    return date.toLocaleString(
      "en-GB",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit"
      }
    );


  } catch (error) {

    return "";

  }

}


/* =========================
   ESCAPE
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
   LOGOUT
========================= */

if (logoutBtn) {

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