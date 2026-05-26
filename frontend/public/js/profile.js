import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


// =========================
// PROFILE SAVE
// =========================

const profileForm =
  document.getElementById("profileForm");

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "../auth/login.html";

    return;
  }

  if (profileForm) {

    profileForm.addEventListener("submit", async (e) => {

      e.preventDefault();

      try {

        // FORM VALUES

        const fullName =
         document.getElementById("fullName")?.value || "";

        const sport =
         document.getElementById("sport")?.value || "";

        const location =
         document.getElementById("location")?.value || "";

        const bio =
          document.getElementById("bio")?.value || "";

        const achievements =
         document.getElementById("achievements")?.value || "";

        const services =
         document.getElementById("services")?.value || "";

        const pbs =
          document.getElementById("pbs")?.value || "";

        const companyName =
         document.getElementById("companyName")?.value || "";

        const investmentInterests =
          document.getElementById("investmentInterests")?.value || "";

        const fundingRange =
          document.getElementById("fundingRange")?.value || "";

        const imageFile =
          document.getElementById("profileImage").files[0];


        let imageUrl = "";


        // =========================
        // IMAGE UPLOAD
        // =========================

        if (imageFile) {

          const storageRef = ref(
            storage,
            `profileImages/${user.uid}`
          );

          await uploadBytes(storageRef, imageFile);

          imageUrl =
            await getDownloadURL(storageRef);

        }


        // =========================
        // UPDATE FIRESTORE
        // =========================

        await updateDoc(
          doc(db, "users", user.uid),
          {

            fullName: fullName,

            sport: sport,

            location: location,

            bio: bio,

            achievements: achievements,

            services: services,

            pbs: pbs,

            companyName: companyName,

            investmentInterests: investmentInterests,

            fundingRange: fundingRange,

            profileImage: imageUrl || "",

            profileCompleted: true

          }
        );


        alert("Profile updated successfully!");


        // REDIRECT
        window.location.href = "dashboard.html";

      } catch (error) {

        console.error(error);

        alert(error.message);

      }

    });

  }

});