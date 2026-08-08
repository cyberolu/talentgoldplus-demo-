import {
  db
} from "../firebase.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const calendarGrid =
  document.getElementById(
    "calendarGrid"
  );

const calendarMonth =
  document.getElementById(
    "calendarMonth"
  );

const calendarPrev =
  document.getElementById(
    "calendarPrev"
  );

const calendarNext =
  document.getElementById(
    "calendarNext"
  );

let events = [];

let currentCalendarDate =
  new Date();

loadCalendarEvents();

async function loadCalendarEvents() {

  if (
    !calendarGrid ||
    !calendarMonth
  ) {
    return;
  }

  try {

    const eventsQuery =
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
      );

    const snapshot =
      await getDocs(
        eventsQuery
      );

    events =
      snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data()
        })
      );

    renderCalendar();

  } catch (error) {

    console.error(
      "Home calendar error:",
      error
    );

    calendarGrid.innerHTML = `
      <p>
        Events calendar could not be loaded.
      </p>
    `;

  }

}

function renderCalendar() {

  const year =
    currentCalendarDate.getFullYear();

  const month =
    currentCalendarDate.getMonth();

  calendarMonth.textContent =
    currentCalendarDate.toLocaleDateString(
      "en-GB",
      {
        month: "long",
        year: "numeric"
      }
    );

  calendarGrid.innerHTML = "";

  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const finalDay =
    new Date(
      year,
      month + 1,
      0
    );

  /*
    JavaScript uses:
    Sunday = 0

    Our calendar starts:
    Monday = 0
  */
  const firstDayPosition =
    (firstDay.getDay() + 6) % 7;

  addPreviousMonthDays(
    year,
    month,
    firstDayPosition
  );

  addCurrentMonthDays(
    year,
    month,
    finalDay.getDate()
  );

  addNextMonthDays();

}

function addPreviousMonthDays(
  year,
  month,
  numberOfDays
) {

  const previousMonthFinalDay =
    new Date(
      year,
      month,
      0
    ).getDate();

  for (
    let position =
      numberOfDays - 1;
    position >= 0;
    position--
  ) {

    const day =
      previousMonthFinalDay -
      position;

    const dayElement =
      createCalendarDay(
        day,
        true
      );

    calendarGrid.appendChild(
      dayElement
    );

  }

}

function addCurrentMonthDays(
  year,
  month,
  totalDays
) {

  const today =
    new Date();

  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {

    const eventsForDay =
      getEventsForDate(
        year,
        month,
        day
      );

    const dayElement =
      createCalendarDay(
        day,
        false
      );

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    if (isToday) {
      dayElement.classList.add(
        "calendar-today"
      );
    }

    if (
      eventsForDay.length > 0
    ) {

      dayElement.classList.add(
        "has-event"
      );

      const eventDot =
        document.createElement(
          "span"
        );

      eventDot.className =
        "calendar-event-dot";

      dayElement.appendChild(
        eventDot
      );

      const firstEvent =
        eventsForDay[0];

      dayElement.title =
        eventsForDay.length === 1
          ? firstEvent.title
          : `${eventsForDay.length} events`;

      dayElement.addEventListener(
        "click",
        () => {

          /*
            For launch:
            Clicking a marked date opens
            the first event on that date.
          */

          window.location.href =
            `pages/event-details.html?id=${firstEvent.id}`;

        }
      );

    }

    calendarGrid.appendChild(
      dayElement
    );

  }

}

function addNextMonthDays() {

  const currentCells =
    calendarGrid.children.length;

  /*
    Keep a consistent 6-row calendar:
    6 × 7 = 42 cells.
  */
  const remainingCells =
    42 - currentCells;

  for (
    let day = 1;
    day <= remainingCells;
    day++
  ) {

    const dayElement =
      createCalendarDay(
        day,
        true
      );

    calendarGrid.appendChild(
      dayElement
    );

  }

}

function createCalendarDay(
  day,
  outsideMonth
) {

  const dayElement =
    document.createElement(
      "button"
    );

  dayElement.type =
    "button";

  dayElement.className =
    "calendar-day";

  dayElement.textContent =
    day;

  if (outsideMonth) {

    dayElement.classList.add(
      "calendar-other-month"
    );

    dayElement.disabled =
      true;

  }

  return dayElement;

}

function getEventsForDate(
  year,
  month,
  day
) {

  return events.filter(
    (event) => {

      if (
        !event.startDate?.toDate
      ) {
        return false;
      }

      const eventDate =
        event.startDate.toDate();

      return (
        eventDate.getFullYear() ===
          year
        &&
        eventDate.getMonth() ===
          month
        &&
        eventDate.getDate() ===
          day
      );

    }
  );

}

calendarPrev?.addEventListener(
  "click",
  () => {

    currentCalendarDate =
      new Date(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth() - 1,
        1
      );

    renderCalendar();

  }
);

calendarNext?.addEventListener(
  "click",
  () => {

    currentCalendarDate =
      new Date(
        currentCalendarDate.getFullYear(),
        currentCalendarDate.getMonth() + 1,
        1
      );

    renderCalendar();

  }
);