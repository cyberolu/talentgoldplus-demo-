import {
  auth,
  db,
  functions
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";


const notificationsList =
  document.getElementById(
    "notificationsList"
  );

const notificationCount =
  document.getElementById(
    "notificationsCount"
  );


const submitAppealFunction =
  httpsCallable(
    functions,
    "submitAppeal"
  );


onAuthStateChanged(
  auth,
  (user) => {

    if (!user) {

      window.location.href =
        "../auth/login.html";

      return;

    }


    loadNotifications(
      user.uid
    );

  }
);


/* =========================
   LOAD NOTIFICATIONS
========================= */

function loadNotifications(
  userId
) {

  if (
    !notificationsList
  ) {
  
    return;
  
  }

  const notificationsQuery =
    query(
      collection(
        db,
        "notifications"
      ),
      where(
        "userId",
        "==",
        userId
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  onSnapshot(
    notificationsQuery,
    (snapshot) => {

      let unreadCount =
        0;


      if (
        notificationsList
      ) {

        notificationsList.innerHTML =
          "";

      }


      if (
        snapshot.empty &&
        notificationsList
      ) {

        notificationsList.innerHTML =
          "<p>No notifications yet.</p>";

        return;

      }


      snapshot.forEach(
        (documentSnapshot) => {

          const notification =
            documentSnapshot.data();


          if (
            !notification.read
          ) {

            unreadCount++;

          }


          const item =
            document.createElement(
              "div"
            );


          item.classList.add(
            "notification-item"
          );


          if (
            !notification.read
          ) {

            item.classList.add(
              "unread"
            );

          }


          const appealButton =
            notification.type ===
              "content_hidden" &&
            notification.appealAvailable ===
              true &&
            notification.reportId
              ? `
                <button
                  type="button"
                  class="appeal-notification-btn"
                  data-notification-id="${escapeAttribute(
                    documentSnapshot.id
                  )}"
                  data-report-id="${escapeAttribute(
                    notification.reportId
                  )}"
                >
                  Appeal Decision
                </button>
              `
              : "";


          item.innerHTML = `

            <div class="notification-content">

              ${
                notification.title
                  ? `
                    <strong>
                      ${escapeHtml(
                        notification.title
                      )}
                    </strong>
                  `
                  : ""
              }

              <p>
                ${escapeHtml(
                  notification.message ||
                  "New notification"
                )}
              </p>

              <small>
                ${formatNotificationType(
                  notification.type
                )}
              </small>

            </div>


            <div class="notification-actions">

              ${appealButton}

              <button
                type="button"
                class="open-notification-btn"
                data-id="${escapeAttribute(
                  documentSnapshot.id
                )}"
                data-type="${escapeAttribute(
                  notification.type ||
                  ""
                )}"
                data-conversation-id="${escapeAttribute(
                  notification.conversationId ||
                  ""
                )}"
                data-item-id="${escapeAttribute(
                  notification.itemId ||
                  ""
                )}"
                data-collection-name="${escapeAttribute(
                  notification.collectionName ||
                  ""
                )}"
                data-report-id="${escapeAttribute(
                  notification.reportId ||
                  ""
                )}"
              >
                ${getButtonText(
                  notification.type
                )}
              </button>

            </div>

          `;


          notificationsList.appendChild(
            item
          );

        }
      );


      if (
        notificationCount
      ) {

        notificationCount.textContent =
          unreadCount;

      }


      attachNotificationEvents();

      attachAppealEvents();

    }
  );

}


/* =========================
   NORMAL NOTIFICATION ACTIONS
========================= */

function attachNotificationEvents() {

  document
    .querySelectorAll(
      ".open-notification-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const notificationId =
              button.dataset.id;

            const type =
              button.dataset.type;

            const conversationId =
              button.dataset.conversationId;

            const itemId =
              button.dataset.itemId;

            const collectionName =
              button.dataset.collectionName;

            const reportId =
              button.dataset.reportId;


            if (
              notificationId
            ) {

              await markNotificationRead(
                notificationId
              );

            }


            routeNotification({
              type,
              conversationId,
              itemId,
              collectionName,
              reportId
            });

          }
        );

      }
    );

}


/* =========================
   CENTRAL ROUTER
========================= */

function routeNotification({
  type,
  conversationId,
  itemId,
  collectionName,
  reportId
}) {

  /* =========================
     MESSAGES
  ========================= */

  if (
    type === "new_message" &&
    conversationId
  ) {

    window.location.href =
      `messages.html?conversation=${encodeURIComponent(
        conversationId
      )}`;

    return;

  }


  /* =========================
     CONNECTIONS
  ========================= */

  if (
    type === "connection_accepted" ||
    type === "connection_request"
  ) {

    window.location.href =
      "connections.html";

    return;

  }


  /* =========================
     MARKETPLACE
  ========================= */

  if (
    type === "marketplace_listing_approved" ||
    type === "marketplace_listing_expired" ||
    type === "marketplace_listing_renewed" ||
    type === "listing_approved" ||
    type === "listing_rejected"
  ) {

    window.location.href =
      "my-submissions.html";

    return;

  }


  /* =========================
     EVENTS
  ========================= */

  if (
    type === "event_approved" ||
    type === "event_rejected"
  ) {

    window.location.href =
      "my-submissions.html";

    return;

  }


  /* =========================
     OPPORTUNITIES
  ========================= */

  if (
    type === "opportunity_approved" ||
    type === "opportunity_rejected"
  ) {

    window.location.href =
      "my-submissions.html";

    return;

  }


  /* =========================
     FUNDRAISERS
  ========================= */

  if (
    type === "fundraiser_approved" ||
    type === "fundraiser_rejected"
  ) {

    window.location.href =
      "my-submissions.html";

    return;

  }


  /* =========================
     ARCHIVE
  ========================= */

  if (
    type === "content_archived" ||
    type === "content_auto_archived"
  ) {

    window.location.href =
      "my-submissions.html";

    return;

  }


  /* =========================
     MODERATION
  ========================= */

  if (
    type === "content_hidden"
  ) {

    /*
      Stay on notifications so the
      user can read the reason and appeal.
    */

    return;

  }


  if (
    type === "appeal_submitted"
  ) {

    /*
      User already knows the appeal
      is pending. Stay on notifications.
    */

    return;

  }


  if (
    type === "appeal_rejected"
  ) {

    /*
      Keep them on notifications so
      they can read the final decision.
    */

    return;

  }


  if (
    type === "appeal_accepted" ||
    type === "content_restored"
  ) {

    window.location.href =
      "community.html";

    return;

  }


  /* =========================
     ACCOUNT
  ========================= */

  if (
    type === "user_role_changed"
  ) {

    window.location.href =
      "profile.html";

    return;

  }


  if (
    type === "account_reactivated"
  ) {

    window.location.href =
      "dashboard.html";

    return;

  }


  if (
    type === "account_suspended"
  ) {

    /*
      Do not route suspended users
      into pages they may no longer
      be permitted to access.
    */

    return;

  }


  /* =========================
     GENERIC CONTENT ROUTING
  ========================= */

  if (
    collectionName === "marketplaceListings" ||
    collectionName === "events" ||
    collectionName === "opportunities" ||
    collectionName === "fundraisers"
  ) {

    window.location.href =
      "my-submissions.html";

    return;

  }


  /* =========================
     FALLBACK
  ========================= */

  window.location.href =
    "dashboard.html";

}


/* =========================
   APPEAL EVENTS
========================= */

function attachAppealEvents() {

  document
    .querySelectorAll(
      ".appeal-notification-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const reportId =
              button.dataset.reportId;

            const notificationId =
              button.dataset.notificationId;


            if (
              !reportId
            ) {

              alert(
                "The moderation case could not be identified."
              );

              return;

            }


            const appealReason =
              await openAppealModal();


            if (
              !appealReason
            ) {

              return;

            }


            try {

              button.disabled =
                true;

              button.textContent =
                "Submitting...";


              await submitAppealFunction({

                reportId,

                reason:
                  appealReason

              });


              if (
                notificationId
              ) {

                await markNotificationRead(
                  notificationId
                );

              }


              alert(
                "Your appeal has been submitted and will be reviewed by TalentGoldPlus."
              );


              button.textContent =
                "Appeal Submitted";


            } catch (
              error
            ) {

              console.error(
                "Appeal submission failed:",
                error
              );


              alert(
                error?.message ||
                "Unable to submit your appeal."
              );


              button.disabled =
                false;

              button.textContent =
                "Appeal Decision";

            }

          }
        );

      }
    );

}


/* =========================
   APPEAL MODAL
========================= */

function openAppealModal() {

  return new Promise(
    (resolve) => {

      const overlay =
        document.createElement(
          "div"
        );


      overlay.className =
        "appeal-modal-overlay";


      overlay.innerHTML = `

        <div class="appeal-modal">

          <h3>
            Appeal Moderation Decision
          </h3>


          <p>
            Explain why you believe the decision to hide your post should be reviewed.
          </p>


          <label
            for="appealReason"
          >
            Appeal reason
          </label>


          <textarea
            id="appealReason"
            class="appeal-reason-input"
            placeholder="Please explain your appeal..."
            maxlength="1500"
          ></textarea>


          <div class="appeal-character-count">

            <span id="appealCharacterCount">
              0
            </span>

            / 1500

          </div>


          <div class="appeal-modal-actions">

            <button
              type="button"
              id="appealCancelBtn"
              class="appeal-cancel-btn"
            >
              Cancel
            </button>


            <button
              type="button"
              id="appealSubmitBtn"
              class="appeal-submit-btn"
            >
              Submit Appeal
            </button>

          </div>

        </div>

      `;


      document.body.appendChild(
        overlay
      );


      const reasonInput =
        overlay.querySelector(
          "#appealReason"
        );


      const characterCount =
        overlay.querySelector(
          "#appealCharacterCount"
        );


      const cancelButton =
        overlay.querySelector(
          "#appealCancelBtn"
        );


      const submitButton =
        overlay.querySelector(
          "#appealSubmitBtn"
        );


      reasonInput.focus();


      reasonInput.addEventListener(
        "input",
        () => {

          characterCount.textContent =
            reasonInput.value.length;

        }
      );


      function closeModal(
        value = ""
      ) {

        overlay.remove();

        resolve(
          value
        );

      }


      cancelButton.addEventListener(
        "click",
        () => {

          closeModal();

        }
      );


      submitButton.addEventListener(
        "click",
        () => {

          const reason =
            reasonInput.value.trim();


          if (
            reason.length <
            10
          ) {

            alert(
              "Please provide at least 10 characters explaining your appeal."
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
            event.target ===
            overlay
          ) {

            closeModal();

          }

        }
      );

    }
  );

}


/* =========================
   MARK READ
========================= */

async function markNotificationRead(
  notificationId
) {

  try {

    await updateDoc(
      doc(
        db,
        "notifications",
        notificationId
      ),
      {
        read:
          true
      }
    );


  } catch (
    error
  ) {

    console.error(
      "Unable to mark notification as read:",
      error
    );

  }

}


/* =========================
   BUTTON TEXT
========================= */

function getButtonText(
  type
) {

  if (
    type === "new_message"
  ) {

    return "Open Message";

  }


  if (
    type === "connection_accepted" ||
    type === "connection_request"
  ) {

    return "View Connection";

  }


  if (
    type === "marketplace_listing_approved" ||
    type === "marketplace_listing_expired" ||
    type === "marketplace_listing_renewed" ||
    type === "listing_approved" ||
    type === "listing_rejected" ||
    type === "event_approved" ||
    type === "event_rejected" ||
    type === "opportunity_approved" ||
    type === "opportunity_rejected" ||
    type === "fundraiser_approved" ||
    type === "fundraiser_rejected" ||
    type === "content_archived" ||
    type === "content_auto_archived"
  ) {

    return "View Submission";

  }


  if (
    type === "content_hidden"
  ) {

    return "Mark Read";

  }


  if (
    type === "appeal_submitted" ||
    type === "appeal_rejected"
  ) {

    return "Mark Read";

  }


  if (
    type === "appeal_accepted" ||
    type === "content_restored"
  ) {

    return "View Community";

  }


  if (
    type === "user_role_changed"
  ) {

    return "View Profile";

  }


  return "Open";

}


/* =========================
   NOTIFICATION TYPE
========================= */

function formatNotificationType(
  type
) {

  if (
    type === "new_message"
  ) {

    return "Message";

  }


  if (
    type === "connection_accepted" ||
    type === "connection_request"
  ) {

    return "Connection";

  }


  if (
    type &&
    type.includes(
      "marketplace"
    )
  ) {

    return "Marketplace";

  }


  if (
    type &&
    (
      type.includes(
        "appeal"
      ) ||
      type.includes(
        "content_hidden"
      ) ||
      type.includes(
        "content_restored"
      )
    )
  ) {

    return "Moderation";

  }


  if (
    type &&
    (
      type.includes(
        "approved"
      ) ||
      type.includes(
        "rejected"
      ) ||
      type.includes(
        "archived"
      )
    )
  ) {

    return "Submission";

  }


  if (
    type &&
    (
      type.includes(
        "account"
      ) ||
      type.includes(
        "role"
      )
    )
  ) {

    return "Account";

  }


  return "Notification";

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