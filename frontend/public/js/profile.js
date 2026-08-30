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

import {
  renderRoleFields,
  populateRoleFields,
  collectRoleFields
} from "./profile-fields.js";

const profileForm =
  document.getElementById("profileForm");

const dynamicProfileFields =
  document.getElementById("dynamicProfileFields");

let currentRole = "";
let existingProfileImage = "";

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

function updateProfilePageTitle(isCompleted, role) {

  const heroSub =
    document.getElementById("profileHeroSub");

  const heroTitle =
    document.getElementById("profileHeroTitle");

  const heroText =
    document.getElementById("profileHeroText");

  const saveButton =
    document.getElementById("profileSaveBtn");

  const isPartner =
    role === "partner";

  if (isCompleted) {

    if (heroSub) {
      heroSub.textContent =
        isPartner
          ? "EDIT ORGANISATION"
          : "EDIT PROFILE";
    }

    if (heroTitle) {
      heroTitle.textContent =
        isPartner
          ? "Edit Your Organisation Profile"
          : "Edit Your Profile";
    }

    if (heroText) {
      heroText.textContent =
        isPartner
          ? "Update your organisation information and partnership details."
          : "Update your TalentGoldPlus profile details so your information stays accurate.";
    }

    if (saveButton) {
      saveButton.textContent =
        isPartner
          ? "Update Organisation"
          : "Update Profile";
    }

    return;
  }

  if (heroSub) {
    heroSub.textContent =
      isPartner
        ? "PARTNER PROFILE SETUP"
        : "PROFILE SETUP";
  }

  if (heroTitle) {
    heroTitle.textContent =
      isPartner
        ? "Complete Your Organisation Profile"
        : "Complete Your Profile";
  }

  if (heroText) {
    heroText.textContent =
      isPartner
        ? "Add your organisation information so the TalentGoldPlus community can discover your work."
        : "Build your TalentGoldPlus identity so athletes, coaches, scouts, professionals and supporters can discover you.";
  }

  if (saveButton) {
    saveButton.textContent =
      isPartner
        ? "Save Organisation"
        : "Save Profile";
  }

}

function populateProfileForm(userData) {

  setValue(
    "fullName",
    userData.fullName ||
    userData.name ||
    ""
  );

  setValue(
    "location",
    userData.location || ""
  );

  setValue(
    "bio",
    userData.bio || ""
  );

  populateRoleFields(
    currentRole,
    userData
  );
}

// =========================
// AUTH + PROFILE SAVE
// =========================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "/login";
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

  renderRoleFields(
    dynamicProfileFields,
    currentRole
  );

  populateProfileForm(userData);

  updateProfilePageTitle(
    userData.profileCompleted === true,
    currentRole
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

    const roleProfileData =
      collectRoleFields(currentRole);

    const profileData = {

      fullName:
        document
          .getElementById("fullName")
          ?.value
          .trim() || "",

      location:
        document
          .getElementById("location")
          ?.value
          .trim() || "",

      bio:
        document
          .getElementById("bio")
          ?.value
          .trim() || "",

      role: currentRole,

      ...roleProfileData,

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

      window.location.href = "/dashboard";

    } catch (error) {

      console.error(error);
      alert(error.message);

    }

  });

});
