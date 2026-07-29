import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const fundraiserForm =
  document.getElementById("fundraiserForm");

const startFundraisingBtn =
  document.getElementById("startFundraisingBtn");

const fundraisersGrid =
  document.getElementById("fundraisersGrid");

const fundraiserDetail =
  document.getElementById("fundraiserDetail");

let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (startFundraisingBtn) {
    startFundraisingBtn.style.display =
      user ? "inline-flex" : "none";
  }

  if (user) {

    try {

      const userSnap =
        await getDoc(
          doc(db, "users", user.uid)
        );

      if (userSnap.exists()) {
        currentUserData =
          userSnap.data();
      }

    } catch (error) {

      console.error(
        "Unable to load user details:",
        error
      );

    }

  }

  if (fundraisersGrid) {
    await loadFundraisers();
  }

  if (fundraiserDetail) {
    await loadFundraiserDetail();
  }

});

/* =========================
   CREATE FUNDRAISER
========================= */

if (fundraiserForm) {

  fundraiserForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!currentUser) {
        alert(
          "Please log in before creating a fundraiser."
        );
        return;
      }

      const title =
        document
          .getElementById("fundraiserTitle")
          .value
          .trim();

      const purpose =
        document
          .getElementById("fundraiserPurpose")
          .value;

      const sport =
        document
          .getElementById("fundraiserSport")
          .value
          .trim();

      const targetAmount =
        Number(
          document
            .getElementById("targetAmount")
            .value
        );

      const location =
        document
          .getElementById("fundraiserLocation")
          .value
          .trim();

      const deadline =
        document
          .getElementById("fundraiserDeadline")
          .value;

      const story =
        document
          .getElementById("fundraiserStory")
          .value
          .trim();

      const imageFile =
        document
          .getElementById("fundraiserImage")
          ?.files[0];

      let fundraiserImage = "";

      try {

        if (imageFile) {

          const safeFileName =
            imageFile.name
              .replaceAll(" ", "-");

          const imageRef =
            ref(
              storage,
              `fundraisers/${currentUser.uid}/${Date.now()}-${safeFileName}`
            );

          await uploadBytes(
            imageRef,
            imageFile
          );

          fundraiserImage =
            await getDownloadURL(imageRef);

        }

        await addDoc(
          collection(db, "fundraisers"),
          {
            title,
            purpose,
            sport,
            targetAmount,
            amountRaised: 0,
            location,
            deadline,
            story,
            fundraiserImage,

            createdBy:
              currentUser.uid,

            createdByName:
              currentUserData?.fullName ||
              currentUserData?.name ||
              "TalentGoldPlus User",

            createdByRole:
              currentUserData?.role ||
              "member",

            status: "pending",
            createdAt: serverTimestamp()
          }
        );

        alert(
          "Fundraising request submitted. It will appear once approved."
        );

        window.location.href =
          "raise-funds.html";

      } catch (error) {

        console.error(
          "Unable to create fundraiser:",
          error
        );

        alert(
          "The fundraising request could not be submitted. Please try again."
        );

      }

    }
  );

}

/* =========================
   LOAD FUNDRAISERS
========================= */

async function loadFundraisers() {

  fundraisersGrid.innerHTML =
    "<p>Loading fundraisers...</p>";

  try {

    const fundraisersQuery =
      query(
        collection(db, "fundraisers"),
        orderBy("createdAt", "desc")
      );

    const snapshot =
      await getDocs(fundraisersQuery);

    const fundraisers = [];

    snapshot.forEach((fundraiserDoc) => {

      const fundraiser =
        fundraiserDoc.data();

      if (
        fundraiser.status !== "approved"
      ) {
        return;
      }

      if (
        fundraiser.deadline &&
        new Date(fundraiser.deadline) <
        new Date()
      ) {
        return;
      }

      fundraisers.push({
        id: fundraiserDoc.id,
        ...fundraiser
      });

    });

    renderFundraisers(fundraisers);

  } catch (error) {

    console.error(
      "Unable to load fundraisers:",
      error
    );

    fundraisersGrid.innerHTML = `
      <div class="empty-state">
        <h2>Unable to Load Fundraisers</h2>
        <p>
          Please refresh the page and try again.
        </p>
      </div>
    `;

  }

}

/* =========================
   RENDER FUNDRAISERS
========================= */

function renderFundraisers(fundraisers) {

  fundraisersGrid.innerHTML = "";

  if (!fundraisers.length) {

    fundraisersGrid.innerHTML = `
      <div class="empty-state">
        <h2>No Fundraisers Yet</h2>

        <p>
          Approved fundraising pages will appear here once submitted and reviewed.
        </p>

        <a
          href="create-fundraiser.html"
          class="btn-primary"
        >
          Start Fundraising
        </a>
      </div>
    `;

    return;
  }

  fundraisers.forEach((fundraiser) => {

    const raised =
      Number(
        fundraiser.amountRaised || 0
      );

    const target =
      Number(
        fundraiser.targetAmount || 0
      );

    const percentage =
      target > 0
        ? Math.min(
            Math.round(
              (raised / target) * 100
            ),
            100
          )
        : 0;

    const image =
      fundraiser.fundraiserImage &&
      fundraiser.fundraiserImage
        .startsWith("http")
        ? fundraiser.fundraiserImage
        : "../assets/images/TalentGoldPlus.png";

    const card =
      document.createElement("article");

    card.classList.add(
      "fundraiser-card"
    );

    card.innerHTML = `
      <img
        src="${image}"
        alt="${escapeHtml(
          fundraiser.title ||
          "Fundraiser"
        )}"
        class="fundraiser-image"
        loading="lazy"
      >

      <div class="fundraiser-body">

        <span class="fundraiser-purpose">
          ${formatText(
            fundraiser.purpose
          )}
        </span>

        <h3>
          ${escapeHtml(
            fundraiser.title ||
            "Untitled Fundraiser"
          )}
        </h3>

        <p class="fundraiser-story">
          ${escapeHtml(
            fundraiser.story ||
            "No story added."
          )}
        </p>

        <div class="fundraiser-meta">

          <p>
            <strong>Sport:</strong>
            ${escapeHtml(
              fundraiser.sport ||
              "Not specified"
            )}
          </p>

          <p>
            <strong>Location:</strong>
            ${escapeHtml(
              fundraiser.location ||
              "Not specified"
            )}
          </p>

        </div>

        <div
          class="fundraiser-progress"
          aria-label="${percentage}% funded"
        >
          <div
            class="fundraiser-progress-bar"
            style="width: ${percentage}%"
          ></div>
        </div>

        <p class="fundraiser-money">
          £${raised.toLocaleString("en-GB")}
          raised of
          £${target.toLocaleString("en-GB")}
        </p>

        <p class="fundraiser-deadline">
          <strong>Deadline:</strong>
          ${formatDate(
            fundraiser.deadline
          )}
        </p>

        <a
          href="fundraiser-details.html?id=${fundraiser.id}"
          class="btn-primary fundraiser-view-btn"
        >
          View Fundraiser
        </a>

      </div>
    `;

    fundraisersGrid.appendChild(card);

  });

}

/* =========================
   FUNDRAISER DETAILS
========================= */

async function loadFundraiserDetail() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const fundraiserId =
    params.get("id");

  if (!fundraiserId) {

    fundraiserDetail.innerHTML =
      "<p>No fundraiser selected.</p>";

    return;
  }

  try {

    const fundraiserRef =
      doc(
        db,
        "fundraisers",
        fundraiserId
      );

    const fundraiserSnap =
      await getDoc(fundraiserRef);

    if (!fundraiserSnap.exists()) {

      fundraiserDetail.innerHTML =
        "<p>This fundraiser could not be found.</p>";

      return;
    }

    const fundraiser =
      fundraiserSnap.data();

    if (
      fundraiser.status !== "approved"
    ) {

      fundraiserDetail.innerHTML =
        "<p>This fundraiser is not currently available.</p>";

      return;
    }

    const raised =
      Number(
        fundraiser.amountRaised || 0
      );

    const target =
      Number(
        fundraiser.targetAmount || 0
      );

    const percentage =
      target > 0
        ? Math.min(
            Math.round(
              (raised / target) * 100
            ),
            100
          )
        : 0;

    const image =
      fundraiser.fundraiserImage &&
      fundraiser.fundraiserImage
        .startsWith("http")
        ? fundraiser.fundraiserImage
        : "../assets/images/TalentGoldPlus.png";

    fundraiserDetail.innerHTML = `
      <article class="fundraiser-detail-card">

        <img
          src="${image}"
          alt="${escapeHtml(
            fundraiser.title ||
            "Fundraiser"
          )}"
          class="fundraiser-detail-image"
        >

        <div class="fundraiser-detail-content">

          <span class="fundraiser-purpose">
            ${formatText(
              fundraiser.purpose
            )}
          </span>

          <h1>
            ${escapeHtml(
              fundraiser.title ||
              "Untitled Fundraiser"
            )}
          </h1>

          <p>
            <strong>Sport:</strong>
            ${escapeHtml(
              fundraiser.sport ||
              "Not specified"
            )}
          </p>

          <p>
            <strong>Location:</strong>
            ${escapeHtml(
              fundraiser.location ||
              "Not specified"
            )}
          </p>

          <p>
            <strong>Created By:</strong>
            ${escapeHtml(
              fundraiser.createdByName ||
              "TalentGoldPlus User"
            )}
          </p>

          <div
            class="fundraiser-progress"
            aria-label="${percentage}% funded"
          >
            <div
              class="fundraiser-progress-bar"
              style="width: ${percentage}%"
            ></div>
          </div>

          <p class="fundraiser-money">
            £${raised.toLocaleString("en-GB")}
            raised of
            £${target.toLocaleString("en-GB")}
            (${percentage}%)
          </p>

          <p>
            <strong>Deadline:</strong>
            ${formatDate(
              fundraiser.deadline
            )}
          </p>

          <h2>Story</h2>

          <p class="fundraiser-full-story">
            ${escapeHtml(
              fundraiser.story ||
              "No story added."
            )}
          </p>

          <button
            type="button"
            class="btn-primary fundraiser-donate-btn"
            disabled
          >
            Donate Coming Soon
          </button>

        </div>

      </article>
    `;

  } catch (error) {

    console.error(
      "Unable to load fundraiser details:",
      error
    );

    fundraiserDetail.innerHTML = `
      <p>
        This fundraiser could not be loaded.
        Please try again.
      </p>
    `;

  }

}

/* =========================
   HELPERS
========================= */

function formatText(value) {

  return (
    value || "General"
  )
    .toString()
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

}

function formatDate(value) {

  if (!value) {
    return "Not specified";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );

}

function escapeHtml(value) {

  return String(
    value || ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}