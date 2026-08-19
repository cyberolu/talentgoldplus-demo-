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
  Timestamp,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


/* =========================
   ELEMENTS
========================= */

const createEventForm =
  document.getElementById(
    "createEventForm"
  );

const isOnline =
  document.getElementById(
    "isOnline"
  );

const physicalLocationFields =
  document.getElementById(
    "physicalLocationFields"
  );

const onlineLocationFields =
  document.getElementById(
    "onlineLocationFields"
  );

const registrationType =
  document.getElementById(
    "registrationType"
  );

const paidEventFields =
  document.getElementById(
    "paidEventFields"
  );

const eventImage =
  document.getElementById(
    "eventImage"
  );

const eventImagePreview =
  document.getElementById(
    "eventImagePreview"
  );

const allDayEvent =
  document.getElementById(
    "allDayEvent"
  );

const startTime =
  document.getElementById(
    "startTime"
  );

const endTime =
  document.getElementById(
    "endTime"
  );


/* =========================
   STATE
========================= */

let currentUser =
  null;

let editingEventId =
  null;

let existingEventImage =
  "";


/* =========================
   EDIT PARAMETER
========================= */

const params =
  new URLSearchParams(
    window.location.search
  );

editingEventId =
  params.get(
    "edit"
  );


/* =========================
   AUTH
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser =
      user;

    if (
      user &&
      createEventForm &&
      editingEventId
    ) {

      await loadEventForEditing();

    }

  }
);


/* =========================
   LISTENERS
========================= */

if (
  isOnline
) {

  isOnline.addEventListener(
    "change",
    toggleLocationFields
  );

}


if (
  registrationType
) {

  registrationType.addEventListener(
    "change",
    togglePaidFields
  );

}


if (
  eventImage
) {

  eventImage.addEventListener(
    "change",
    previewEventImage
  );

}


if (
  allDayEvent
) {

  allDayEvent.addEventListener(
    "change",
    toggleAllDay
  );

}


if (
  createEventForm
) {

  createEventForm.addEventListener(
    "submit",
    handleEventSubmit
  );

}


/* =========================================================
   LOAD EVENT FOR EDIT
========================================================= */

async function loadEventForEditing() {

  try {

    const eventRef =
      doc(
        db,
        "events",
        editingEventId
      );


    const eventSnap =
      await getDoc(
        eventRef
      );


    if (
      !eventSnap.exists()
    ) {

      alert(
        "This event could not be found."
      );

      window.location.href =
        "my-submissions.html#events";

      return;

    }


    const event =
      eventSnap.data();


    /* OWNER CHECK */

    if (
      event.organiserId !==
      currentUser.uid
    ) {

      alert(
        "You do not have permission to edit this event."
      );

      window.location.href =
        "my-submissions.html#events";

      return;

    }


    const status =
      (
        event.status ||
        ""
      ).toLowerCase();


    if (
      status !== "pending" &&
      status !== "rejected"
    ) {

      alert(
        "Approved events cannot be edited directly."
      );

      window.location.href =
        "my-submissions.html#events";

      return;

    }


    existingEventImage =
      event.imageUrl ||
      "";


    /* =========================
       BASIC DETAILS
    ========================= */

    setValue(
      "eventTitle",
      event.title
    );

    setValue(
      "eventSummary",
      event.summary
    );

    setValue(
      "eventDescription",
      event.description
    );

    setValue(
      "eventCategory",
      event.category
    );

    setValue(
      "eventSport",
      event.sport
    );


    /* =========================
       DATE / TIME
    ========================= */

    const start =
      timestampToDate(
        event.startDate
      );

    const end =
      timestampToDate(
        event.endDate
      );


    if (
      start
    ) {

      setValue(
        "startDate",
        formatDateInput(start)
      );

      if (
        !event.allDay
      ) {

        setValue(
          "startTime",
          formatTimeInput(start)
        );

      }

    }


    if (
      end
    ) {

      setValue(
        "endDate",
        formatDateInput(end)
      );

      if (
        !event.allDay
      ) {

        setValue(
          "endTime",
          formatTimeInput(end)
        );

      }

    }


    if (
      allDayEvent
    ) {

      allDayEvent.checked =
        Boolean(
          event.allDay
        );

    }


    toggleAllDay();


    /* =========================
       LOCATION
    ========================= */

    if (
      isOnline
    ) {

      isOnline.checked =
        Boolean(
          event.isOnline
        );

    }


    setValue(
      "venueName",
      event.venueName
    );

    setValue(
      "eventAddress",
      event.address
    );

    setValue(
      "eventTown",
      event.town
    );

    setValue(
      "eventCounty",
      event.county
    );

    setValue(
      "eventCountry",
      event.country
    );

    setValue(
      "eventPostcode",
      event.postcode
    );

    setValue(
      "meetingPlatform",
      event.meetingPlatform
    );

    setValue(
      "meetingLink",
      event.meetingLink
    );


    toggleLocationFields();


    /* =========================
       REGISTRATION
    ========================= */

    setValue(
      "registrationType",
      event.registrationType
    );


    if (
      event.registrationType ===
      "paid"
    ) {

      /*
        Stored in pence.

        1000 → 10.00
      */
      setValue(
        "eventPrice",
        (
          Number(
            event.price ||
            0
          ) /
          100
        ).toFixed(2)
      );


      setValue(
        "eventCurrency",
        event.currency ||
        "GBP"
      );

    }


    setValue(
      "eventCapacity",
      event.capacity
    );


    togglePaidFields();


    /* =========================
       AUDIENCE
    ========================= */

    setValue(
      "ageGroup",
      event.ageGroup
    );

    setValue(
      "eventLevel",
      event.level
    );

    setValue(
      "equipmentRequired",
      event.equipmentRequired
    );

    setValue(
      "accessibility",
      event.accessibility
    );


    /* =========================
       EXISTING IMAGE
    ========================= */

    if (
      existingEventImage &&
      eventImagePreview
    ) {

      eventImagePreview.innerHTML = `
        <img
          src="${existingEventImage}"
          alt="Current event banner"
        >
      `;

    }


    /* =========================
       PAGE HEADING
    ========================= */

    const pageHeading =
      document.querySelector(
        ".services-hero h1"
      );


    if (
      pageHeading
    ) {

      pageHeading.textContent =
        status === "rejected"
          ? "Edit & Resubmit Event"
          : "Edit Event";

    }


    const submitButton =
      createEventForm.querySelector(
        'button[type="submit"]'
      );


    if (
      submitButton
    ) {

      submitButton.textContent =
        status === "rejected"
          ? "Resubmit Event"
          : "Save Changes";

    }

  } catch (error) {

    console.error(
      "Event edit load error:",
      error
    );


    alert(
      "The event could not be loaded."
    );

  }

}


/* =========================
   LOCATION TOGGLE
========================= */

function toggleLocationFields() {

  if (
    !isOnline
  ) {
    return;
  }


  const online =
    isOnline.checked;


  if (
    physicalLocationFields
  ) {

    physicalLocationFields.hidden =
      online;

  }


  if (
    onlineLocationFields
  ) {

    onlineLocationFields.hidden =
      !online;

  }

}


/* =========================
   PAID EVENT TOGGLE
========================= */

function togglePaidFields() {

  if (
    !registrationType
  ) {
    return;
  }


  const isPaid =
    registrationType.value ===
    "paid";


  if (
    paidEventFields
  ) {

    paidEventFields.hidden =
      !isPaid;

  }

}


/* =========================
   ALL DAY
========================= */

function toggleAllDay() {

  if (
    !allDayEvent
  ) {
    return;
  }


  const isAllDay =
    allDayEvent.checked;


  if (
    startTime
  ) {

    startTime.disabled =
      isAllDay;


    if (
      isAllDay
    ) {

      startTime.value =
        "";

    }

  }


  if (
    endTime
  ) {

    endTime.disabled =
      isAllDay;


    if (
      isAllDay
    ) {

      endTime.value =
        "";

    }

  }

}


/* =========================
   IMAGE PREVIEW
========================= */

function previewEventImage() {

  const file =
    eventImage
      ?.files
      ?.[0];


  if (
    !file ||
    !eventImagePreview
  ) {

    return;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "Please select an image file."
    );


    eventImage.value =
      "";


    return;

  }


  const imageUrl =
    URL.createObjectURL(
      file
    );


  eventImagePreview.innerHTML = `
    <img
      src="${imageUrl}"
      alt="Event banner preview"
    >
  `;

}


/* =========================================================
   CREATE / UPDATE EVENT
========================================================= */

async function handleEventSubmit(
  event
) {

  event.preventDefault();


  if (
    !currentUser
  ) {

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


  if (
    submitButton
  ) {

    submitButton.disabled =
      true;


    submitButton.textContent =
      editingEventId
        ? "Saving..."
        : "Submitting Event...";

  }


  try {

    /* =========================
       BASIC
    ========================= */

    const title =
      getValue(
        "eventTitle"
      );

    const summary =
      getValue(
        "eventSummary"
      );

    const description =
      getValue(
        "eventDescription"
      );

    const category =
      getValue(
        "eventCategory"
      );

    const sport =
      getValue(
        "eventSport"
      );


    /* =========================
       DATE / TIME
    ========================= */

    const startDateValue =
      getValue(
        "startDate"
      );

    const startTimeValue =
      getValue(
        "startTime"
      );

    const endDateValue =
      getValue(
        "endDate"
      );

    const endTimeValue =
      getValue(
        "endTime"
      );


    const online =
      isOnline
        ?.checked ||
      false;


    const allDay =
      allDayEvent
        ?.checked ||
      false;


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


    if (
      !startDate
    ) {

      throw new Error(
        "Please select a valid start date."
      );

    }


    if (
      endDate &&
      endDate <
      startDate
    ) {

      throw new Error(
        "The end date cannot be before the start date."
      );

    }


    /* =========================
       REGISTRATION
    ========================= */

    const registration =
      registrationType.value;


    let price =
      0;


    let currency =
      "GBP";


    if (
      registration ===
      "paid"
    ) {

      const priceInput =
        Number(
          getValue(
            "eventPrice"
          )
        );


      if (
        !Number.isFinite(
          priceInput
        ) ||
        priceInput <= 0
      ) {

        throw new Error(
          "Please enter a valid event price."
        );

      }


      price =
        Math.round(
          priceInput *
          100
        );


      currency =
        getValue(
          "eventCurrency"
        ) ||
        "GBP";

    }


    /* =========================
       IMAGE
    ========================= */

    let imageUrl =
      existingEventImage;


    const imageFile =
      eventImage
        ?.files
        ?.[0];


    if (
      imageFile
    ) {

      imageUrl =
        await uploadEventImage(
          imageFile,
          currentUser.uid
        );

    }


    /* =========================
       COMMON EVENT DATA
    ========================= */

    const eventData = {

      title,

      summary,

      description,

      category,

      sport,


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


      updatedAt:
        serverTimestamp()
    };


    /* =====================================================
       UPDATE EXISTING EVENT
    ===================================================== */

    if (
      editingEventId
    ) {

      const eventRef =
        doc(
          db,
          "events",
          editingEventId
        );


      const eventSnap =
        await getDoc(
          eventRef
        );


      if (
        !eventSnap.exists()
      ) {

        throw new Error(
          "This event no longer exists."
        );

      }


      const original =
        eventSnap.data();


      if (
        original.organiserId !==
        currentUser.uid
      ) {

        throw new Error(
          "You do not have permission to edit this event."
        );

      }


      const originalStatus =
        (
          original.status ||
          ""
        ).toLowerCase();


      if (
        originalStatus !== "pending" &&
        originalStatus !== "rejected"
      ) {

        throw new Error(
          "Approved events cannot be edited directly."
        );

      }


      await updateDoc(
        eventRef,
        {
          ...eventData,


          status:
            "pending",


          featured:
            false,


          rejectionReason:
            "",


          rejectedBy:
            "",


          rejectedAt:
            null
        }
      );


      alert(
        originalStatus ===
          "rejected"
          ? "Your event has been updated and resubmitted for approval."
          : "Your event changes have been saved."
      );


      window.location.href =
        "my-submissions.html#events";


      return;

    }


    /* =====================================================
       CREATE NEW EVENT
    ===================================================== */

    const newEventData = {

      ...eventData,


      organiserId:
        currentUser.uid,


      organiserName:
        currentUser.displayName ||
        "",


      organiserEmail:
        currentUser.email ||
        "",


      registrationCount:
        0,


      status:
        "pending",


      featured:
        false,


      createdAt:
        serverTimestamp()
    };


    await addDoc(
      collection(
        db,
        "events"
      ),
      newEventData
    );


    alert(
      "Your event has been submitted for approval."
    );


    window.location.href =
      "my-submissions.html#events";

  } catch (error) {

    console.error(
      "Event submission error:",
      error
    );


    alert(
      error.message ||
      "The event could not be saved."
    );

  } finally {

    if (
      submitButton
    ) {

      submitButton.disabled =
        false;


      submitButton.textContent =
        editingEventId
          ? "Save Changes"
          : "Submit Event";

    }

  }

}


/* =========================
   DATE BUILDER
========================= */

function buildEventDate(
  dateValue,
  timeValue,
  allDay
) {

  if (
    !dateValue
  ) {

    return null;

  }


  const time =
    allDay
      ? "00:00"
      : timeValue ||
        "00:00";


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


/* =========================
   FIRESTORE DATE
========================= */

function timestampToDate(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  if (
    typeof value.toDate ===
    "function"
  ) {

    return value.toDate();

  }


  if (
    value instanceof Date
  ) {

    return value;

  }


  const parsed =
    new Date(
      value
    );


  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;

}


/* =========================
   DATE INPUT FORMAT
========================= */

function formatDateInput(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


/* =========================
   TIME INPUT FORMAT
========================= */

function formatTimeInput(
  date
) {

  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );


  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );


  return `${hours}:${minutes}`;

}


/* =========================
   VALUE HELPERS
========================= */

function getValue(
  elementId
) {

  return (
    document
      .getElementById(
        elementId
      )
      ?.value
      ?.trim() ||
    ""
  );

}


function setValue(
  elementId,
  value
) {

  const element =
    document.getElementById(
      elementId
    );


  if (
    element
  ) {

    element.value =
      value ??
      "";

  }

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


  if (
    !value
  ) {

    return null;

  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;

}


/* =========================
   IMAGE UPLOAD
========================= */

async function uploadEventImage(
  file,
  userId
) {

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "Please select a valid image file."
    );

  }


  const safeFileName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );


  const filePath =
    `events/${userId}/${Date.now()}-${safeFileName}`;


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