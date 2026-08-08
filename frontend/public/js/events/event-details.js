import {
  auth,
  db
} from "../firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  initialiseRegistration
} from "./event-registration.js";

const eventDetails =
  document.getElementById("eventDetails");

const params =
  new URLSearchParams(window.location.search);

const eventId =
  params.get("id");

loadEvent();

async function loadEvent() {

  if (!eventDetails) {
    return;
  }

  if (!eventId) {

    eventDetails.innerHTML = `
      <div class="event-details-message">
        <h1>Event Not Found</h1>

        <p>
          No event was selected.
        </p>

        <a
          href="events.html"
          class="btn-primary"
        >
          Browse Events
        </a>
      </div>
    `;

    return;
  }

  try {

    const eventReference =
      doc(
        db,
        "events",
        eventId
      );

    const eventSnapshot =
      await getDoc(
        eventReference
      );

    if (!eventSnapshot.exists()) {

      showNotFound();

      return;
    }

    const event =
      {
        id: eventSnapshot.id,
        ...eventSnapshot.data()
      };

    /*
      Public users should only see published events.

      The organiser can still preview their own
      pending event while logged in.
    */

    const currentUser =
      auth.currentUser;

    const ownsEvent =
      currentUser &&
      event.organiserId ===
        currentUser.uid;

    if (
      event.status !== "published" &&
      !ownsEvent
    ) {

      showNotFound();

      return;
    }

    renderEvent(event);

  } catch (error) {

    console.error(
      "Event details error:",
      error
    );

    eventDetails.innerHTML = `
      <div class="event-details-message">
        <h1>Unable to Load Event</h1>

        <p>
          This event could not be loaded at the moment.
        </p>

        <a
          href="events.html"
          class="btn-secondary"
        >
          Return to Events
        </a>
      </div>
    `;

  }

}

function renderEvent(event) {

  const startDate =
    convertDate(
      event.startDate
    );

  const endDate =
    convertDate(
      event.endDate
    );

  const image =
    event.imageUrl || "";

  const location =
    event.isOnline
      ? "Online Event"
      : buildLocation(event);

  const price =
    getPriceLabel(event);

  const status =
    event.status || "pending";

  eventDetails.innerHTML = `
    <article class="event-details">

      ${
        image
          ? `
            <div class="event-details-banner">

              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(
                  event.title ||
                  "TalentGoldPlus event"
                )}"
              >

            </div>
          `
          : ""
      }

      <div class="event-details-layout">

        <div class="event-details-main">

          <div class="event-details-tags">

            ${
              event.category
                ? `
                  <span>
                    ${formatLabel(
                      event.category
                    )}
                  </span>
                `
                : ""
            }

            ${
              event.sport
                ? `
                  <span>
                    ${formatLabel(
                      event.sport
                    )}
                  </span>
                `
                : ""
            }

            ${
              status !== "published"
                ? `
                  <span>
                    ${formatLabel(
                      status
                    )}
                  </span>
                `
                : ""
            }

          </div>

          <h1>
            ${escapeHtml(
              event.title || "Event"
            )}
          </h1>

          ${
            event.summary
              ? `
                <p class="event-details-summary">
                  ${escapeHtml(
                    event.summary
                  )}
                </p>
              `
              : ""
          }

          <section class="event-details-block">

            <h2>
              About This Event
            </h2>

            <div class="event-description">
              ${formatDescription(
                event.description
              )}
            </div>

          </section>

          ${
            event.ageGroup ||
            event.level ||
            event.equipmentRequired ||
            event.accessibility
              ? `
                <section class="event-details-block">

                  <h2>
                    Event Information
                  </h2>

                  <div class="event-info-list">

                    ${
                      event.ageGroup
                        ? `
                          <p>
                            <strong>Age Group:</strong>
                            ${escapeHtml(
                              event.ageGroup
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      event.level
                        ? `
                          <p>
                            <strong>Level:</strong>
                            ${formatLabel(
                              event.level
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      event.equipmentRequired
                        ? `
                          <p>
                            <strong>
                              Equipment / Requirements:
                            </strong>
                            ${escapeHtml(
                              event.equipmentRequired
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      event.accessibility
                        ? `
                          <p>
                            <strong>
                              Accessibility:
                            </strong>
                            ${escapeHtml(
                              event.accessibility
                            )}
                          </p>
                        `
                        : ""
                    }

                  </div>

                </section>
              `
              : ""
          }

          ${
            event.organiserName ||
            event.organiserEmail
              ? `
                <section class="event-details-block">

                  <h2>
                    Organiser
                  </h2>

                  ${
                    event.organiserName
                      ? `
                        <p>
                          ${escapeHtml(
                            event.organiserName
                          )}
                        </p>
                      `
                      : ""
                  }

                  ${
                    event.organiserEmail
                      ? `
                        <p>
                          ${escapeHtml(
                            event.organiserEmail
                          )}
                        </p>
                      `
                      : ""
                  }

                </section>
              `
              : ""
          }

        </div>

        <aside class="event-details-sidebar">

          <div class="event-booking-card">

            <h2>
              Event Details
            </h2>

            <div class="event-booking-row">

              <strong>
                Date
              </strong>

              <span>
                ${formatDateRange(
                  startDate,
                  endDate,
                  event.allDay
                )}
              </span>

            </div>

            <div class="event-booking-row">

              <strong>
                Location
              </strong>

              <span>
                ${escapeHtml(location)}
              </span>

            </div>

            <div class="event-booking-row">

              <strong>
                Price
              </strong>

              <span>
                ${price}
              </span>

            </div>

            ${
              event.capacity
                ? `
                  <div class="event-booking-row">

                    <strong>
                      Capacity
                    </strong>

                    <span>
                      ${event.capacity}
                    </span>

                  </div>
                `
                : ""
            }

            ${createRegistrationButton(
              event
            )}

          </div>

        </aside>

      </div>

    </article>
  `;
  initialiseRegistration(event);

}

function createRegistrationButton(
  event
) {

  if (
    event.status !== "published"
  ) {

    return `
      <p class="event-status-message">
        This event has not yet been published.
      </p>
    `;

  }

  if (
    event.registrationType ===
    "paid"
  ) {

    return `
      <button
        type="button"
        class="btn-primary event-register-button"
        id="eventRegisterBtn"
      >
        Buy Ticket
      </button>

      <p class="event-payment-note">
        Online payment will be added to TalentGoldPlus.
      </p>
    `;

  }

  if (
    event.registrationType ===
    "registration"
  ) {

    return `
      <button
        type="button"
        class="btn-primary event-register-button"
        id="eventRegisterBtn"
      >
        Register
      </button>
    `;

  }

  return `
    <button
      type="button"
      class="btn-primary event-register-button"
      id="eventRegisterBtn"
    >
      Register Free
    </button>
  `;

}

function showNotFound() {

  eventDetails.innerHTML = `
    <div class="event-details-message">

      <h1>
        Event Not Found
      </h1>

      <p>
        This event may no longer be available.
      </p>

      <a
        href="events.html"
        class="btn-primary"
      >
        Browse Events
      </a>

    </div>
  `;

}

function convertDate(
  value
) {

  if (!value) {
    return null;
  }

  if (value.toDate) {
    return value.toDate();
  }

  return new Date(value);

}

function formatDateRange(
  start,
  end,
  allDay
) {

  if (!start) {
    return "Date TBC";
  }

  const dateOptions = {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  const startDate =
    start.toLocaleDateString(
      "en-GB",
      dateOptions
    );

  if (allDay) {

    if (
      !end ||
      start.toDateString() ===
        end.toDateString()
    ) {

      return startDate;

    }

    const endDate =
      end.toLocaleDateString(
        "en-GB",
        dateOptions
      );

    return `${startDate} – ${endDate}`;

  }

  const startTime =
    start.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  if (!end) {

    return `
      ${startDate},
      ${startTime}
    `;

  }

  const endDate =
    end.toLocaleDateString(
      "en-GB",
      dateOptions
    );

  const endTime =
    end.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  if (
    start.toDateString() ===
      end.toDateString()
  ) {

    return `
      ${startDate},
      ${startTime} – ${endTime}
    `;

  }

  return `
    ${startDate},
    ${startTime}
    –
    ${endDate},
    ${endTime}
  `;

}

function buildLocation(
  event
) {

  const parts = [
    event.venueName,
    event.town,
    event.country
  ].filter(Boolean);

  return (
    parts.join(", ") ||
    "Location TBC"
  );

}

function getPriceLabel(
  event
) {

  if (
    event.registrationType !==
      "paid" ||
    !event.price
  ) {

    return "Free";

  }

  const amount =
    Number(event.price) / 100;

  try {

    return new Intl.NumberFormat(
      "en-GB",
      {
        style: "currency",
        currency:
          event.currency ||
          "GBP"
      }
    ).format(amount);

  } catch {

    return `${amount.toFixed(2)} ${
      event.currency || "GBP"
    }`;

  }

}

function formatLabel(
  value = ""
) {

  return value
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

}

function formatDescription(
  value = ""
) {

  return escapeHtml(value)
    .replaceAll(
      "\n",
      "<br>"
    );

}

function escapeHtml(
  value = ""
) {

  const element =
    document.createElement(
      "div"
    );

  element.textContent =
    value;

  return element.innerHTML;

}