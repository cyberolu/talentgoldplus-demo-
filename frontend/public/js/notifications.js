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
                class="open-notification-btn"
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


            if (
              notificationId
            ) {

              await markNotificationRead(
                notificationId
              );

            }


            if (
              type ===
                "new_message" &&
              conversationId
            ) {

              window.location.href =
                `messages.html?conversation=${encodeURIComponent(
                  conversationId
                )}`;

              return;

            }


            if (
              type ===
              "connection_accepted"
            ) {

              window.location.href =
                "connections.html";

              return;

            }


            if (
              type ===
              "content_hidden"
            ) {

              /*
                Keep user on notifications
                so they can read the reason
                and use Appeal Decision.
              */

              return;

            }


            if (
              type ===
                "appeal_submitted" ||
              type ===
                "content_restored"
            ) {

              return;

            }


            window.location.href =
              "dashboard.html";

          }
        );

      }
    );

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
    type ===
    "new_message"
  ) {

    return "Open Message";

  }


  if (
    type ===
    "connection_accepted"
  ) {

    return "View Connection";

  }


  if (
    type ===
    "content_hidden"
  ) {

    return "Mark Read";

  }


  if (
    type ===
    "appeal_submitted"
  ) {

    return "Mark Read";

  }


  if (
    type ===
    "content_restored"
  ) {

    return "Mark Read";

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
    type ===
    "new_message"
  ) {

    return "Message";

  }


  if (
    type ===
    "connection_accepted"
  ) {

    return "Connection";

  }


  if (
    type ===
    "content_hidden"
  ) {

    return "Moderation";

  }


  if (
    type ===
    "appeal_submitted"
  ) {

    return "Appeal";

  }


  if (
    type ===
    "content_restored"
  ) {

    return "Moderation";

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