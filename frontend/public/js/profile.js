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
let existingProfileImage = "";

// =========================
// DYNAMIC FIELDS
// =========================

function renderDynamicFields(role) {

  if (!dynamicProfileFields) return;

  if (role === "athlete") {

    dynamicProfileFields.innerHTML = `
  <select id="sport" required>
    <option value="">Select Your Sport</option>
    <option value="football">Football</option>
    <option value="athletics">Athletics</option>
    <option value="basketball">Basketball</option>
    <option value="rugby">Rugby</option>
    <option value="tennis">Tennis</option>
    <option value="combat-sports">Combat Sports</option>
    <option value="other-sports">Other Sports</option>
  </select>

  <input
    type="text"
    id="pbs"
    placeholder="Personal Best, Position or Event"
  >

  <textarea
    id="achievements"
    placeholder="Achievements"
  ></textarea>
`;

  } else if (role === "professional") {

    dynamicProfileFields.innerHTML = `
      <select id="professionalCategory" required>

        <option value="">Select Professional Category</option>

        <option value="coach">Coach</option>
        <option value="physiotherapist">Physiotherapist</option>
        <option value="sports-therapist">Sports Therapist</option>
        <option value="nutritionist">Nutritionist</option>
        <option value="psychologist">Psychologist</option>
        <option value="wellbeing-specialist">Wellbeing Specialist</option>
        <option value="recovery-expert">Recovery Expert</option>
        <option value="mentor">Mentor</option>
        <option value="performance-specialist">Performance Specialist</option>

      </select>

      <input
        type="text"
        id="qualifications"
        placeholder="Qualifications"
      >

      <textarea
        id="services"
        placeholder="Services Offered"
      ></textarea>
    `;

  } else if (role === "scout") {

    dynamicProfileFields.innerHTML = `
      <select id="sport">

        <option value="">Primary Sport</option>

        <option value="football">Football</option>
        <option value="athletics">Athletics</option>
        <option value="basketball">Basketball</option>
        <option value="rugby">Rugby</option>
        <option value="tennis">Tennis</option>
        <option value="combat-sports">Combat Sports</option>
        <option value="swimming">Swimming</option>
        <option value="cycling">Cycling</option>
        <option value="cricket">Cricket</option>
        <option value="gymnastics">Gymnastics</option>
        <option value="netball">Netball</option>
        <option value="volleyball">Volleyball</option>
        <option value="other-sports">Other Sports</option>

      </select>

      <input
        type="text"
        id="organisation"
        placeholder="Organisation"
      >

      <input
        type="text"
        id="scoutingRegion"
        placeholder="Scouting Region"
      >
    `;

  } else if (role === "investor") {

    dynamicProfileFields.innerHTML = `
      <input
        type="text"
        id="companyName"
        placeholder="Company / Organisation"
      >

      <input
        type="text"
        id="investmentInterests"
        placeholder="Investment Interests"
      >

      <input
        type="text"
        id="fundingRange"
        placeholder="Funding Range"
      >
    `;

  } else {

    dynamicProfileFields.innerHTML = "";

  }

}

// =========================
// LOAD EXISTING PROFILE
// =========================

function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value = value || "";
  }

}

function updateProfilePageTitle(isCompleted) {

  const heroSub =
    document.querySelector(".hero-sub");

  const heroTitle =
    document.querySelector(".dashboard-hero h1");

  const heroText =
    document.querySelector(".dashboard-hero p:last-child");

  const saveButton =
    profileForm?.querySelector("button[type='submit']");

  if (isCompleted) {

    if (heroSub) {
      heroSub.textContent = "EDIT PROFILE";
    }

    if (heroTitle) {
      heroTitle.textContent = "Edit Your Profile";
    }

    if (heroText) {
      heroText.textContent =
        "Update your TalentGoldPlus profile details so your information stays accurate.";
    }

    if (saveButton) {
      saveButton.textContent = "Update Profile";
    }

  } else {

    if (heroSub) {
      heroSub.textContent = "PROFILE SETUP";
    }

    if (heroTitle) {
      heroTitle.textContent = "Complete Your Profile";
    }

    if (heroText) {
      heroText.textContent =
        "Build your TalentGoldPlus identity so athletes, coaches, scouts, professionals and supporters can discover you.";
    }

    if (saveButton) {
      saveButton.textContent = "Save Profile";
    }

  }

}

function populateProfileForm(userData) {

  setValue("fullName", userData.fullName || userData.name || "");
  setValue("location", userData.location || "");
  setValue("bio", userData.bio || "");

  setValue("sport", userData.sport || userData.category || "");
  setValue("pbs", userData.pbs || "");
  setValue("achievements", userData.achievements || "");

  setValue("services", userData.services || "");
  setValue("qualifications", userData.qualifications || "");
  setValue("professionalCategory", userData.professionalCategory || "");

  setValue("organisation", userData.organisation || "");
  setValue("scoutingRegion", userData.scoutingRegion || "");

  setValue("companyName", userData.companyName || "");
  setValue("investmentInterests", userData.investmentInterests || "");
  setValue("fundingRange", userData.fundingRange || "");

}

// =========================
// AUTH + PROFILE SAVE
// =========================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  const userRef =
    doc(db, "users", user.uid);

  const userSnap =
    await getDoc(userRef);

  let userData = {};

  if (userSnap.exists()) {

    userData =
      userSnap.data();

    currentRole =
      userData.role || "athlete";

    existingProfileImage =
      userData.profileImage || "";

  } else {

    currentRole = "athlete";

  }

  renderDynamicFields(currentRole);

  populateProfileForm(userData);

  updateProfilePageTitle(
    userData.profileCompleted === true
  );

  if (!profileForm) return;

  profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

      const imageInput =
        document.getElementById("profileImage");

      const imageFile =
        imageInput?.files?.[0];

      let imageUrl =
        existingProfileImage;

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
        fullName:
          document.getElementById("fullName")?.value.trim() || "",
        location:
          document.getElementById("location")?.value.trim() || "",
        bio:
          document.getElementById("bio")?.value.trim() || "",

        role: currentRole,

        sport:
          document.getElementById("sport")?.value.trim() || "",
        pbs:
          document.getElementById("pbs")?.value.trim() || "",
        achievements:
          document.getElementById("achievements")?.value.trim() || "",

        services:
          document.getElementById("services")?.value.trim() || "",
        qualifications:
          document.getElementById("qualifications")?.value.trim() || "",
        professionalCategory:
          document.getElementById("professionalCategory")?.value || "",

        organisation:
          document.getElementById("organisation")?.value.trim() || "",
        scoutingRegion:
          document.getElementById("scoutingRegion")?.value.trim() || "",

        companyName:
          document.getElementById("companyName")?.value.trim() || "",
        investmentInterests:
          document.getElementById("investmentInterests")?.value.trim() || "",
        fundingRange:
          document.getElementById("fundingRange")?.value.trim() || "",

        profileImage: imageUrl,
        profileCompleted: true,
        updatedAt: new Date()
      };

      await setDoc(
        userRef,
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