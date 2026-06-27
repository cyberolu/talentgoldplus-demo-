import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const professionalsGrid =
  document.getElementById("professionalsGrid");

const professionalSearch =
  document.getElementById("professionalSearch");

const directoryTitle =
  document.getElementById("directoryTitle");

const filterButtons =
  document.querySelectorAll(".filter-btn");

  let allProfessionals = [];

  const params =
    new URLSearchParams(window.location.search);
  
  let activeCategory =
    params.get("category") || "";

async function loadProfessionals() {

  const professionalsQuery =
    query(
      collection(db, "users"),
      where("role", "==", "professional")
    );

  const snapshot =
    await getDocs(professionalsQuery);

  allProfessionals = [];

  snapshot.forEach((docSnap) => {

    allProfessionals.push({
      id: docSnap.id,
      ...docSnap.data()
    });

  });

  setActiveFilterButton();
  renderProfessionals();

}

function renderProfessionals() {

  const searchText =
    professionalSearch
      ? normalise(professionalSearch.value)
      : "";
    professionalsGrid.innerHTML = "";

  const filteredProfessionals =
    allProfessionals.filter((user) => {

      const category =
        normalise(user.professionalCategory);

      const name =
        normalise(user.fullName || user.name);

      const location =
        normalise(user.location);

      const services =
        normalise(user.services);

      const qualifications =
        normalise(user.qualifications);

      const bio =
        normalise(user.bio);

      const matchesCategory =
        !activeCategory ||
        category === normalise(activeCategory);

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        location.includes(searchText) ||
        services.includes(searchText) ||
        qualifications.includes(searchText) ||
        bio.includes(searchText) ||
        category.includes(searchText);

      return matchesCategory && matchesSearch;

    });

  if (directoryTitle) {

    directoryTitle.textContent =
      activeCategory
        ? `${formatCategory(activeCategory)} Directory`
        : "Professionals Directory";

  }

  if (filteredProfessionals.length === 0) {

    professionalsGrid.innerHTML =
      "<p>No professionals found.</p>";

    return;

  }

  filteredProfessionals.forEach((user) => {

    const image =
      user.profileImage &&
      user.profileImage.trim() !== ""
        ? user.profileImage
        : "../assets/images/avatar-placeholder.png";

    const name =
      user.fullName ||
      user.name ||
      "Professional Member";

    const category =
      user.professionalCategory ||
      "Professional";

      const location =
        user.location ||
        user.organisation ||
        user.companyName ||
        "Location unavailable";

      const services =
        user.services ||
        user.bio ||
        user.qualifications ||
        "Professional support services";

    const card =
      document.createElement("div");

    card.classList.add("athlete-card");

    card.innerHTML = `
      <img
        src="${image}"
        alt="${name}"
        onerror="this.src='../assets/images/avatar-placeholder.png'"
      >

      <div class="athlete-info">
        <h3>${name}</h3>

        <p class="sport">
          ${formatCategory(category)}
        </p>

        <p>
          ${location}
        </p>

        <p class="pb">
          ${services}
        </p>

        <a href="profile.html?user=${user.id}" class="btn-primary">
          View Profile
        </a>
      </div>
    `;

    professionalsGrid.appendChild(card);

  });

}

function normalise(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value.join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).join(" ");
  }

  return value
    .toString()
    .replaceAll("-", " ")
    .trim()
    .toLowerCase();
}

function formatCategory(category) {

  return (category || "Professional")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

}

function setActiveFilterButton() {

  filterButtons.forEach((button) => {

    const buttonCategory =
      button.dataset.category || "";

    button.classList.toggle(
      "active",
      normalise(buttonCategory) === normalise(activeCategory)
    );

  });

}

filterButtons.forEach((button) => {

  button.addEventListener("click", () => {

    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    activeCategory =
      button.dataset.category || "";

    renderProfessionals();

    document
      .getElementById("professionalsDirectory")
      ?.scrollIntoView({
        behavior: "smooth"
      });

  });

});

if (professionalSearch) {

  professionalSearch.addEventListener("input", () => {
    renderProfessionals();
  });

}

loadProfessionals();