import { auth, db } from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const allowedRoles = [
  "admin",
  "superadmin"
];

const roleOptions = [
  "athlete",
  "coach",
  "professional",
  "scout",
  "moderator",
  "admin",
  "superadmin"
];

const professionalCategoryOptions = [
  "coach",
  "physiotherapist",
  "sports-therapist",
  "nutritionist",
  "psychologist",
  "wellbeing-specialist",
  "recovery-expert",
  "mentor",
  "performance-specialist"
];

const adminWelcome =
  document.getElementById("adminWelcome");

const usersTableBody =
  document.getElementById("usersTableBody");

const logoutBtn =
  document.getElementById("logoutBtn");

let currentAdmin = null;
let currentAdminRole = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  currentAdmin = user;

  const adminRef =
    doc(db, "users", user.uid);

  const adminSnap =
    await getDoc(adminRef);

  if (!adminSnap.exists()) {
    window.location.href = "../pages/dashboard.html";
    return;
  }

  const adminData =
    adminSnap.data();

  currentAdminRole =
    adminData.role || "athlete";

  if (!allowedRoles.includes(currentAdminRole)) {
    alert("You do not have permission to access this page.");
    window.location.href = "../pages/dashboard.html";
    return;
  }

  adminWelcome.textContent =
    `Welcome ${adminData.name || adminData.fullName || "Admin"} (${currentAdminRole})`;

  await loadUsers();

});

async function loadUsers() {

  usersTableBody.innerHTML = `
    <tr>
      <td colspan="5">Loading users...</td>
    </tr>
  `;

  const usersSnapshot =
    await getDocs(collection(db, "users"));

  usersTableBody.innerHTML = "";

  if (usersSnapshot.empty) {

    usersTableBody.innerHTML = `
      <tr>
        <td colspan="5">No users found.</td>
      </tr>
    `;

    return;

  }

  usersSnapshot.forEach((userDoc) => {

    const user =
      userDoc.data();

    const userId =
      userDoc.id;

    const name =
      user.fullName ||
      user.name ||
      "TalentGoldPlus User";

    const email =
      user.email ||
      "No email";

    const role =
      user.role ||
      "athlete";

    const profileImage =
      user.profileImage &&
      user.profileImage.startsWith("http")
        ? user.profileImage
        : "../assets/images/avatar-placeholder.png";

    const tr =
      document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="admin-user-cell">
          <img
            src="${profileImage}"
            alt="${name}"
            onerror="this.src='../assets/images/avatar-placeholder.png'"
          >

          <div>
            <strong>${name}</strong>
            <p>${user.sport || user.professionalCategory || ""}</p>
          </div>
        </div>
      </td>

      <td>${email}</td>

      <td>
        <span class="admin-status">${role}</span>
      </td>

      <td>
        <select
          class="admin-role-select"
          data-user-id="${userId}"
          ${currentAdminRole !== "superadmin" ? "disabled" : ""}
        >
          ${roleOptions.map((option) => `
            <option
              value="${option}"
              ${option === role ? "selected" : ""}
            >
              ${option}
            </option>
          `).join("")}
        </select>
      </td>

      <td>
        ${user.profileCompleted ? "Profile complete" : "Profile incomplete"}
      </td>
    `;

    usersTableBody.appendChild(tr);

  });

  attachRoleChangeEvents();

}

function attachRoleChangeEvents() {

  document.querySelectorAll(".admin-role-select")
    .forEach((select) => {

      select.addEventListener("change", async () => {

        if (currentAdminRole !== "superadmin") {
          alert("Only superadmins can change roles.");
          return;
        }

        const userId =
          select.dataset.userId;

        const newRole =
          select.value;

        const confirmChange =
          confirm(
            `Are you sure you want to change this user role to ${newRole}?`
          );

        if (!confirmChange) {
          await loadUsers();
          return;
        }

        try {

          const updateData = {};

          if (professionalCategoryOptions.includes(newRole)) {

            updateData.role = "professional";
            updateData.professionalCategory = newRole;
          
            updateData.sport = "";
            updateData.category = "";
            updateData.pbs = "";
            updateData.achievements = "";
          
          } else {
          
            updateData.role = newRole;
            updateData.professionalCategory = "";
          
          }
          
          await updateDoc(
            doc(db, "users", userId),
            updateData
          );

          alert("User role updated successfully.");

          await loadUsers();

        } catch (error) {

          console.error(error);
          alert(error.message);

        }

      });

    });

}

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href =
      "../index.html";

  });

}