import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  createProfileCard
} from "./profile-card.js";

const professionalsGrid =
  document.getElementById(
    "professionalsGrid"
  );

const professionalSearch =
  document.getElementById(
    "professionalSearch"
  );

const directoryTitle =
  document.getElementById(
    "directoryTitle"
  );

const filterButtons =
  document.querySelectorAll(
    ".filter-btn"
  );

const params =
  new URLSearchParams(
    window.location.search
  );

let activeCategory =
  params.get("category") || "";

let allProfessionals = [];

async function loadProfessionals() {

  if (!professionalsGrid) return;

  professionalsGrid.innerHTML = `
    <div class="directory-message">
      <p>Loading professionals...</p>
    </div>
  `;

  try {

    const professionalsQuery =
      query(
        collection(db, "users"),
        where(
          "role",
          "==",
          "professional"
        )
      );

    const snapshot =
      await getDocs(
        professionalsQuery
      );

    allProfessionals =
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

    setActiveFilterButton();
    renderProfessionals();

  } catch (error) {

    console.error(
      "Unable to load professionals:",
      error
    );

    professionalsGrid.innerHTML = `
      <div class="directory-message directory-error">

        <h3>
          Unable to load professionals
        </h3>

        <p>
          Please refresh the page and try again.
        </p>

      </div>
    `;

  }

}

function renderProfessionals() {

  if (!professionalsGrid) return;

  const searchText =
    normalise(
      professionalSearch?.value
    );

  const filteredProfessionals =
    allProfessionals.filter((user) => {

      const category =
        normalise(
          user.professionalCategory
        );

      const searchableText =
        normalise([
          user.fullName,
          user.name,
          user.location,
          user.city,
          user.country,
          user.services,
          user.qualifications,
          user.bio,
          user.organisation,
          user.companyName,
          user.specialisms,
          user.specialties,
          user.professionalCategory
        ]);

      const matchesCategory =
        !activeCategory ||
        category ===
        normalise(activeCategory);

      const matchesSearch =
        !searchText ||
        searchableText.includes(
          searchText
        );

      return (
        matchesCategory &&
        matchesSearch
      );

    });

  updateDirectoryTitle(
    filteredProfessionals.length
  );

  professionalsGrid.innerHTML = "";

  if (
    filteredProfessionals.length === 0
  ) {

    professionalsGrid.innerHTML = `
      <div class="directory-message">

        <h3>
          No professionals found
        </h3>

        <p>
          Try another search term or category.
        </p>

      </div>
    `;

    return;

  }

  filteredProfessionals.forEach(
    (user) => {

      const card =
        createProfileCard(
          user,
          {
            profilePage: "/profile",
            roleLabel: "Professional",
            fallbackImage:
              "../assets/images/avatar-placeholder.png"
          }
        );

      professionalsGrid.appendChild(
        card
      );

    }
  );

}

function updateDirectoryTitle(
  resultCount
) {

  if (!directoryTitle) return;

  const title =
    activeCategory
      ? `${formatCategory(
          activeCategory
        )} Directory`
      : "Professionals Directory";

  directoryTitle.textContent =
    `${title} (${resultCount})`;

}

function setActiveFilterButton() {

  filterButtons.forEach((button) => {

    const category =
      button.dataset.category || "";

    button.classList.toggle(
      "active",
      normalise(category) ===
      normalise(activeCategory)
    );

  });

}

function updatePageURL() {

  const url =
    new URL(
      window.location.href
    );

  if (activeCategory) {

    url.searchParams.set(
      "category",
      activeCategory
    );

  } else {

    url.searchParams.delete(
      "category"
    );

  }

  window.history.replaceState(
    {},
    "",
    url
  );

}

function normalise(value) {

  if (!value) return "";

  if (Array.isArray(value)) {

    return value
      .map((item) => {

        if (
          item &&
          typeof item === "object"
        ) {

          return Object
            .values(item)
            .join(" ");

        }

        return item || "";

      })
      .join(" ")
      .replaceAll("-", " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  }

  if (
    typeof value === "object"
  ) {

    return Object
      .values(value)
      .join(" ")
      .replaceAll("-", " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  }

  return String(value)
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

}

function formatCategory(category) {

  return (
    category ||
    "Professional"
  )
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => {
      return letter.toUpperCase();
    });

}

filterButtons.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      activeCategory =
        button.dataset.category || "";

      setActiveFilterButton();
      updatePageURL();
      renderProfessionals();

      document
        .getElementById(
          "professionalsDirectory"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

    }
  );

});

professionalSearch?.addEventListener(
  "input",
  renderProfessionals
);

loadProfessionals();
