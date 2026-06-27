import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const athletesGrid = document.getElementById("athletesGrid");
const athletesTitle = document.getElementById("athletesTitle");

async function loadAthletes() {
  const params = new URLSearchParams(window.location.search);
  const selectedSport = normalise(params.get("sport"));

  const athletesQuery = query(
    collection(db, "users"),
    where("role", "==", "athlete")
  );

  const snapshot = await getDocs(athletesQuery);

  athletesGrid.innerHTML = "";

  const athletes = [];

  snapshot.forEach((docSnap) => {
    athletes.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  const filteredAthletes = athletes.filter((user) => {
    const sport = normalise(user.sport || user.category);

    return !selectedSport || sport === selectedSport;
  });

  if (selectedSport && athletesTitle) {

    if (selectedSport === "athletics") {
      athletesTitle.textContent = "Track & Field Athletes";
    } else {
      athletesTitle.textContent =
        formatText(selectedSport) + " Players";
    }
  
  }

  if (filteredAthletes.length === 0) {
    athletesGrid.innerHTML = "<p>No athletes found.</p>";
    return;
  }

  filteredAthletes.forEach((user) => {
    const image =
      user.profileImage && user.profileImage.trim() !== ""
        ? user.profileImage
        : "../assets/images/avatar-placeholder.png";

    const name =
      user.fullName ||
      user.name ||
      "Athlete Member";

    const sport =
      user.sport ||
      user.category ||
      "Sport not set";

    const location =
      user.location ||
      "Location unavailable";

    const extra =
      user.pbs ||
      user.achievements ||
      user.bio ||
      "Athlete profile";

    const card = document.createElement("div");

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
          ${formatText(sport)}
        </p>

        <p>
          ${location}
        </p>

        <p class="pb">
          ${extra}
        </p>

        <a href="athlete-profile.html?user=${user.id}" class="btn-primary">
          View Profile
        </a>
      </div>
    `;

    athletesGrid.appendChild(card);
  });
}

function normalise(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .trim()
    .toLowerCase();
}

function formatText(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

loadAthletes();