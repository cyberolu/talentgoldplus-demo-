import {
  db
} from "../firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const eventsGrid =
  document.getElementById("eventsGrid");

const eventSearch =
  document.getElementById("eventSearch");

const eventCategoryFilter =
  document.getElementById(
    "eventCategoryFilter"
  );

const eventSportFilter =
  document.getElementById(
    "eventSportFilter"
  );

const eventLocationFilter =
  document.getElementById(
    "eventLocationFilter"
  );

let events = [];

loadEvents();

async function loadEvents() {

  if (!eventsGrid) {
    return;
  }

  try {

    const now =
      Timestamp.now();

    const eventsQuery =
      query(
        collection(db, "events"),
        where(
          "status",
          "==",
          "published"
        ),
        where(
          "startDate",
          ">=",
          now
        ),
        orderBy(
          "startDate",
          "asc"
        )
      );

    const snapshot =
      await getDocs(eventsQuery);

    events =
      snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

    renderEvents(events);

  } catch (error) {

    console.error(
      "Events loading error:",
      error
    );

    eventsGrid.innerHTML = `
      <p>
        Events could not be loaded at this time.
      </p>
    `;
  }
}

function renderEvents(eventList) {

  if (!eventsGrid) {
    return;
  }

  if (eventList.length === 0) {

    eventsGrid.innerHTML = `
      <p class="empty-state">
        No upcoming events found.
      </p>
    `;

    return;
  }

  eventsGrid.innerHTML =
    eventList
      .map(createEventCard)
      .join("");
}

function createEventCard(event) {

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
            month: "short",
            year: "numeric"
          }
        )
      : "Date TBC";

  const eventImage =
    event.imageUrl ||
    "../assets/images/TalentGoldPlus.png";

  const location =
    event.isOnline
      ? "Online"
      : event.location ||
        event.venueName ||
        "Location TBC";

  const price =
    event.price > 0
      ? `${event.currency || "£"}${formatPrice(event.price)}`
      : "Free";

  return `
    <a
      href="event-details.html?id=${event.id}"
      class="event-card"
    >

      <div class="event-card-image-wrap">

        <img
          src="${eventImage}"
          alt="${escapeHtml(
            event.title || "TalentGoldPlus Event"
          )}"
          class="event-card-image"
        >

      </div>

      <div class="event-card-content">

        <div class="event-card-meta">

          <span>
            ${formatCategory(
              event.category
            )}
          </span>

          ${
            event.sport
              ? `
                <span>
                  ${formatCategory(
                    event.sport
                  )}
                </span>
              `
              : ""
          }

        </div>

        <h3>
          ${escapeHtml(
            event.title || "Event"
          )}
        </h3>

        <p class="event-date">
          ${formattedDate}
        </p>

        <p class="event-location">
          ${escapeHtml(location)}
        </p>

        ${
          event.organiserName
            ? `
              <p class="event-organiser">
                Organised by
                ${escapeHtml(
                  event.organiserName
                )}
              </p>
            `
            : ""
        }

        <div class="event-card-footer">

          <strong>
            ${price}
          </strong>

          <span class="btn-secondary">
            View Event
          </span>

        </div>

      </div>

    </a>
  `;
}

function filterEvents() {

  const searchTerm =
    eventSearch?.value
      .trim()
      .toLowerCase() || "";

  const category =
    eventCategoryFilter?.value ||
    "all";

  const sport =
    eventSportFilter?.value ||
    "all";

  const locationType =
    eventLocationFilter?.value ||
    "all";

  const filteredEvents =
    events.filter((event) => {

      const searchableText = `
        ${event.title || ""}
        ${event.description || ""}
        ${event.organiserName || ""}
        ${event.location || ""}
        ${event.venueName || ""}
      `.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        searchableText.includes(
          searchTerm
        );

      const matchesCategory =
        category === "all" ||
        event.category === category;

      const matchesSport =
        sport === "all" ||
        event.sport === sport;

      let matchesLocation = true;

      if (
        locationType === "online"
      ) {
        matchesLocation =
          event.isOnline === true;
      }

      if (
        locationType === "in-person"
      ) {
        matchesLocation =
          event.isOnline !== true;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSport &&
        matchesLocation
      );
    });

  renderEvents(filteredEvents);
}

function formatCategory(value = "") {

  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatPrice(price) {

  /*
    Events will store money in pence.
    1000 = £10.00.
  */

  return (
    Number(price) / 100
  ).toFixed(2);
}

function escapeHtml(value = "") {

  const element =
    document.createElement("div");

  element.textContent = value;

  return element.innerHTML;
}

eventSearch?.addEventListener(
  "input",
  filterEvents
);

eventCategoryFilter?.addEventListener(
  "change",
  filterEvents
);

eventSportFilter?.addEventListener(
  "change",
  filterEvents
);

eventLocationFilter?.addEventListener(
  "change",
  filterEvents
);