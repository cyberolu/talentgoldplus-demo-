import { db } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("user");

if (!userId) {
  document.getElementById("name").textContent = "Athlete not found";
  throw new Error("Missing user ID.");
}

async function loadAthlete() {
  const athleteRef = doc(db, "users", userId);
  const athleteSnap = await getDoc(athleteRef);

  if (!athleteSnap.exists()) {
    document.getElementById("name").textContent = "Athlete not found";
    return;
  }

  const athlete = athleteSnap.data();

  document.getElementById("name").textContent =
    athlete.fullName ||
    athlete.name ||
    "Athlete";

  document.getElementById("sport").textContent =
    formatText(athlete.sport || athlete.category);

  document.getElementById("location").textContent =
    athlete.location ||
    "Location unavailable";

  document.getElementById("extra").textContent =
    athlete.pbs ||
    athlete.achievements ||
    "Performance details coming soon";

  document.getElementById("bio").textContent =
    athlete.bio ||
    "No biography available.";

    const profileImage = document.getElementById("profile-image");

    if (athlete.profileImage && athlete.profileImage.trim() !== "") {
      profileImage.src = athlete.profileImage;
    } else {
      profileImage.src = "../assets/images/avatar-placeholder.png";
    }

  const contactBtn = document.getElementById("contactAthleteBtn");

  if (contactBtn) {
    contactBtn.href = `messages.html?to=${userId}`;
  }
}

function formatText(value) {
  return (value || "")
    .toString()
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

loadAthlete();