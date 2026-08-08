import {
  auth,
  db,
  storage
} from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const createEventForm =
  document.getElementById("createEventForm");

const isOnline =
  document.getElementById("isOnline");

const physicalLocationFields =
  document.getElementById("physicalLocationFields");

const onlineLocationFields =
  document.getElementById("onlineLocationFields");

const registrationType =
  document.getElementById("registrationType");

const paidEventFields =
  document.getElementById("paidEventFields");

const eventImage =
  document.getElementById("eventImage");

const eventImagePreview =
  document.getElementById("eventImagePreview");

const allDayEvent =
  document.getElementById("allDayEvent");

const startTime =
  document.getElementById("startTime");

const endTime =
  document.getElementById("endTime");

let currentUser = null;

onAuthStateChanged(
  auth,
  (user) => {
    currentUser = user;
  }
);

if (isOnline) {
  isOnline.addEventListener(
    "change",
    toggleLocationFields
  );
}

if (registrationType) {
  registrationType.addEventListener(
    "change",
    togglePaidFields
  );
}

if (eventImage) {
  eventImage.addEventListener(
    "change",
    previewEventImage
  );
}

if (allDayEvent) {
  allDayEvent.addEventListener(
    "change",
    toggleAllDay
  );
}

if (createEventForm) {
  createEventForm.addEventListener(
    "submit",
    handleCreateEvent
  );
}

function toggleLocationFields() {

  if (!isOnline) {
    return;
  }

  const online =
    isOnline.checked;

  if (physicalLocationFields) {
    physicalLocationFields.hidden =
      online;
  }

  if (onlineLocationFields) {
    onlineLocationFields.hidden =
      !online;
  }

}

function togglePaidFields() {

  if (!registrationType) {
    return;
  }

  const isPaid =
    registrationType.value === "paid";

  if (paidEventFields) {
    paidEventFields.hidden =
      !isPaid;
  }

}

function toggleAllDay() {

  if (!allDayEvent) {
    return;
  }

  const isAllDay =
    allDayEvent.checked;

  if (startTime) {
    startTime.disabled =
      isAllDay;

    if (isAllDay) {
      startTime.value = "";
    }
  }

  if (endTime) {
    endTime.disabled =
      isAllDay;

    if (isAllDay) {
      endTime.value = "";
    }
  }

}

function previewEventImage() {

  const file =
    eventImage?.files?.[0];

  if (!file || !eventImagePreview) {
    return;
  }

  if (!file.type.startsWith("image/")) {

    alert(
      "Please select an image file."
    );

    eventImage.value = "";

    eventImagePreview.innerHTML = "";

    return;
  }

  const imageUrl =
    URL.createObjectURL(file);

  eventImagePreview.innerHTML = `
    <img
      src="${imageUrl}"
      alt="Event banner preview"
    >
  `;
}

async function handleCreateEvent(
  event
) {

  event.preventDefault();

  if (!currentUser) {

    alert(
      "You must be logged in to create an event."
    );

    window.location.href =
      "../auth/login.html";

    return;
  }

  const submitButton =
    createEventForm.querySelector(
      'button[type="submit"]'
    );

  if (submitButton) {

    submitButton.disabled = true;

    submitButton.textContent =
      "Submitting Event...";

  }

  try {

    const title =
      document
        .getElementById("eventTitle")
        .value
        .trim();

    const summary =
      document
        .getElementById("eventSummary")
        .value
        .trim();

    const description =
      document
        .getElementById("eventDescription")
        .value
        .trim();

    const category =
      document
        .getElementById("eventCategory")
        .value;

    const sport =
      document
        .getElementById("eventSport")
        .value;

    const startDateValue =
      document
        .getElementById("startDate")
        .value;

    const startTimeValue =
      document
        .getElementById("startTime")
        .value;

    const endDateValue =
      document
        .getElementById("endDate")
        .value;

    const endTimeValue =
      document
        .getElementById("endTime")
        .value;

    const online =
      isOnline?.checked || false;

    const allDay =
      allDayEvent?.checked || false;

    const startDate =
      buildEventDate(
        startDateValue,
        startTimeValue,
        allDay
      );

    const endDate =
      endDateValue
        ? buildEventDate(
            endDateValue,
            endTimeValue,
            allDay
          )
        : startDate;

    if (!startDate) {
      throw new Error(
        "Please select a valid start date."
      );
    }

    if (
      endDate &&
      endDate < startDate
    ) {
      throw new Error(
        "The end date cannot be before the start date."
      );
    }

    const registration =
      registrationType.value;

    let price = 0;

    let currency = "GBP";

    if (registration === "paid") {

      const priceInput =
        Number(
          document
            .getElementById("eventPrice")
            .value
        );

      if (
        !Number.isFinite(priceInput) ||
        priceInput <= 0
      ) {
        throw new Error(
          "Please enter a valid event price."
        );
      }

      /*
        Store money in pence.

        £10.00 becomes 1000.
      */
      price =
        Math.round(
          priceInput * 100
        );

      currency =
        document
          .getElementById("eventCurrency")
          .value;
    }

    let imageUrl = "";

    const imageFile =
      eventImage?.files?.[0];

    if (imageFile) {

      imageUrl =
        await uploadEventImage(
          imageFile,
          currentUser.uid
        );

    }

    const eventData = {

      title,
      summary,
      description,
      category,
      sport,

      organiserId:
        currentUser.uid,

      organiserName:
        currentUser.displayName || "",

      organiserEmail:
        currentUser.email || "",

      startDate:
        Timestamp.fromDate(
          startDate
        ),

      endDate:
        Timestamp.fromDate(
          endDate
        ),

      allDay,

      isOnline:
        online,

      venueName:
        online
          ? ""
          : getValue(
              "venueName"
            ),

      address:
        online
          ? ""
          : getValue(
              "eventAddress"
            ),

      town:
        online
          ? ""
          : getValue(
              "eventTown"
            ),

      county:
        online
          ? ""
          : getValue(
              "eventCounty"
            ),

      country:
        online
          ? ""
          : getValue(
              "eventCountry"
            ),

      postcode:
        online
          ? ""
          : getValue(
              "eventPostcode"
            ),

      meetingPlatform:
        online
          ? getValue(
              "meetingPlatform"
            )
          : "",

      meetingLink:
        online
          ? getValue(
              "meetingLink"
            )
          : "",

      registrationType:
        registration,

      price,

      currency,

      capacity:
        getNumber(
          "eventCapacity"
        ),

      registrationCount:
        0,

      ageGroup:
        getValue(
          "ageGroup"
        ),

      level:
        getValue(
          "eventLevel"
        ),

      equipmentRequired:
        getValue(
          "equipmentRequired"
        ),

      accessibility:
        getValue(
          "accessibility"
        ),

      imageUrl,

      status:
        "pending",

      featured:
        false,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };

    const documentReference =
      await addDoc(
        collection(
          db,
          "events"
        ),
        eventData
      );

    console.log(
      "Event created:",
      documentReference.id
    );

    alert(
      "Your event has been submitted for approval."
    );

    window.location.href =
      "events.html";

  } catch (error) {

    console.error(
      "Create event error:",
      error
    );

    alert(
      error.message ||
      "The event could not be created. Please try again."
    );

  } finally {

    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        "Submit Event";

    }

  }

}

function buildEventDate(
  dateValue,
  timeValue,
  allDay
) {

  if (!dateValue) {
    return null;
  }

  const time =
    allDay
      ? "00:00"
      : timeValue || "00:00";

  const date =
    new Date(
      `${dateValue}T${time}`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function getValue(
  elementId
) {

  return (
    document
      .getElementById(
        elementId
      )
      ?.value
      ?.trim() || ""
  );

}

function getNumber(
  elementId
) {

  const value =
    document
      .getElementById(
        elementId
      )
      ?.value;

  if (!value) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;

}

async function uploadEventImage(
  file,
  userId
) {

  const safeFileName =
    file.name
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );

  const filePath = `
events/${userId}/${Date.now()}-${safeFileName}
  `.trim();

  const storageReference =
    ref(
      storage,
      filePath
    );

  await uploadBytes(
    storageReference,
    file,
    {
      contentType:
        file.type
    }
  );

  return getDownloadURL(
    storageReference
  );

}