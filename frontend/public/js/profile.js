import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

const profileForm =
  document.getElementById("profileForm");

const dynamicProfileFields =
  document.getElementById("dynamicProfileFields");

let currentRole = "";

// =========================
// DYNAMIC FIELDS
// =========================

function renderDynamicFields(role) {

  if (!dynamicProfileFields) return;

  if (role === "athlete") {

    dynamicProfileFields.innerHTML = `
      <input type="text" id="sport" placeholder="Sport">

      <input type="text" id="pbs" placeholder="Personal bests / position">

      <textarea id="achievements" placeholder="Achievements"></textarea>
    `;

  } else if (role === "coach") {

    dynamicProfileFields.innerHTML = `
      <input type="text" id="sport" placeholder="Coaching sport">

      <input type="text" id="qualifications" placeholder="Coaching qualifications">

      <textarea id="services" placeholder="Coaching services offered"></textarea>
    `;

  } else if (role === "professional") {

    dynamicProfileFields.innerHTML = `
      <select id="professionalCategory">
        <option value="">Select Professional Category</option>
        <option value="physiotherapist">Physiotherapist</option>
        <option value="sports-therapist">Sports Therapist</option>
        <option value="nutritionist">Nutritionist</option>
        <option value="psychologist">Psychologist</option>
        <option value="wellbeing-specialist">Wellbeing Specialist</option>
        <option value="recovery-expert">Recovery Expert</option>
        <option value="mentor">Mentor</option>
        <option value="performance-specialist">Performance Specialist</option>
      </select>

      <input type="text" id="qualifications" placeholder="Qualifications">

      <textarea id="services" placeholder="Services offered"></textarea>
    `;

  } else if (role === "scout") {

    dynamicProfileFields.innerHTML = `
      <input type="text" id="sport" placeholder="Sport focus">

      <input type="text" id="organisation" placeholder="Organisation">

      <input type="text" id="scoutingRegion" placeholder="Scouting region">
    `;

  } else if (role === "investor") {

    dynamicProfileFields.innerHTML = `
      <input type="text" id="companyName" placeholder="Company / Organisation name">

      <input type="text" id="investmentInterests" placeholder="Investment interests">

      <input type="text" id="fundingRange" placeholder="Funding range">
    `;

  } else {

    dynamicProfileFields.innerHTML = "";

  }

}

// =========================
// PROFILE SAVE
// =========================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "../auth/login.html";

    return;

  }

  try {

    const userRef =
      doc(db, "users", user.uid);

    const userSnap =
      await getDoc(userRef);

    if (userSnap.exists()) {

      const userData =
        userSnap.data();

      currentRole =
        userData.role || "";

      renderDynamicFields(currentRole);

    }

  } catch (error) {

    console.error(error);

  }

  if (!profileForm) return;

  profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

      const fullName =
        document.getElementById("fullName")?.value || "";

      const location =
        document.getElementById("location")?.value || "";

      const bio =
        document.getElementById("bio")?.value || "";

      const sport =
        document.getElementById("sport")?.value || "";

      const pbs =
        document.getElementById("pbs")?.value || "";

      const achievements =
        document.getElementById("achievements")?.value || "";

      const services =
        document.getElementById("services")?.value || "";

      const qualifications =
        document.getElementById("qualifications")?.value || "";

      const professionalCategory =
        document.getElementById("professionalCategory")?.value || "";

      const organisation =
        document.getElementById("organisation")?.value || "";

      const scoutingRegion =
        document.getElementById("scoutingRegion")?.value || "";

      const companyName =
        document.getElementById("companyName")?.value || "";

      const investmentInterests =
        document.getElementById("investmentInterests")?.value || "";

      const fundingRange =
        document.getElementById("fundingRange")?.value || "";

      const imageInput =
        document.getElementById("profileImage");

      const imageFile =
        imageInput?.files?.[0];

      let imageUrl = "";

      if (imageFile) {

        const safeFileName =
          imageFile.name.replaceAll(" ", "-");

        const storageRef = ref(
          storage,
          `profileImages/${user.uid}/${Date.now()}-${safeFileName}`
        );

        await uploadBytes(storageRef, imageFile);

        imageUrl =
          await getDownloadURL(storageRef);

      }

      const profileData = {
        fullName,
        location,
        bio,
        role: currentRole,
        sport,
        pbs,
        achievements,
        services,
        qualifications,
        professionalCategory,
        organisation,
        scoutingRegion,
        companyName,
        investmentInterests,
        fundingRange,
        profileCompleted: true,
        updatedAt: new Date()
      };

      if (imageUrl) {
        profileData.profileImage = imageUrl;
      }

      await setDoc(
        doc(db, "users", user.uid),
        profileData,
        { merge: true }
      );

      alert("Profile updated successfully!");

      window.location.href = "dashboard.html";

    } catch (error) {

      console.error(error);

      alert(error.message);

    }

  });

});