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
  updateDoc,
  deleteDoc,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const reportsGrid =
  document.getElementById("reportsGrid");

const logoutBtn =
  document.getElementById("logoutBtn");

const allowedRoles = [
  "moderator",
  "admin",
  "superadmin"
];

let currentUserRole = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href =
      "../auth/login.html";
    return;
  }

  const userSnap =
    await getDoc(
      doc(db, "users", user.uid)
    );

  if (!userSnap.exists()) {
    window.location.href =
      "../pages/dashboard.html";
    return;
  }

  const userData =
    userSnap.data();

  currentUserRole =
    userData.role || "athlete";

  if (!allowedRoles.includes(currentUserRole)) {
    alert("Access denied.");
    window.location.href =
      "../pages/dashboard.html";
    return;
  }

  await loadReports();

});

async function loadReports() {

  reportsGrid.innerHTML =
    "<p>Loading reports...</p>";

  const reportsQuery =
    query(
      collection(db, "reports"),
      orderBy("createdAt", "desc")
    );

  const snapshot =
    await getDocs(reportsQuery);

  reportsGrid.innerHTML = "";

  if (snapshot.empty) {
    reportsGrid.innerHTML =
      "<p>No reports found.</p>";
    return;
  }

  snapshot.forEach((reportDoc) => {

    const report =
      reportDoc.data();

    const card =
      document.createElement("div");

    card.classList.add("report-card");

    const mediaHtml =
      report.reportedPostMedia
        ? `
          <img
            src="${report.reportedPostMedia}"
            alt="Reported post media"
            class="reported-media"
          >
        `
        : "";

    card.innerHTML = `
      <h3>
        ${formatReportType(report.type)}
      </h3>

      <p>
        <strong>Status:</strong>
        ${report.status || "open"}
      </p>

      <p>
        <strong>Reason:</strong>
        ${report.reason || "No reason provided"}
      </p>

      <div class="reported-content-box">

        <p>
          <strong>Post Author:</strong>
          ${report.reportedPostAuthor || "Unknown"}
        </p>

        <p>
          <strong>Post Content:</strong>
        </p>

        <p>
          ${report.reportedPostText || "No text content."}
        </p>

        ${mediaHtml}

      </div>

      <p>
        <strong>Reported By:</strong>
        ${report.reportedByName || report.reportedBy || "Unknown"}
      </p>

      <div class="report-actions">

        <button
          class="resolve-btn"
          data-id="${reportDoc.id}"
        >
          Mark Resolved
        </button>

        <button
          class="hide-post-btn"
          data-post-id="${report.itemId || ""}"
        >
          Hide Post
        </button>

        <button
            class="restore-post-btn"
            data-post-id="${report.itemId || ""}"
        >
        Restore Post
        </button>

        ${
          currentUserRole === "superadmin"
            ? `
              <button
                class="delete-report-btn"
                data-id="${reportDoc.id}"
              >
                Delete Report
              </button>
            `
            : ""
        }

      </div>
    `;

    reportsGrid.appendChild(card);

  });

  attachReportEvents();

}

function attachReportEvents() {

    document.querySelectorAll(".resolve-btn")
      .forEach((button) => {
  
        button.addEventListener("click", async () => {
  
          await updateDoc(
            doc(db, "reports", button.dataset.id),
            {
              status: "resolved"
            }
          );
  
          await loadReports();
  
        });
  
      });
  
    document.querySelectorAll(".hide-post-btn")
      .forEach((button) => {
  
        button.addEventListener("click", async () => {
  
          const postId =
            button.dataset.postId;
  
          if (!postId) {
            alert("Post ID missing.");
            return;
          }
  
          const confirmHide =
            confirm("Hide this post from the community feed?");
  
          if (!confirmHide) return;
  
          await updateDoc(
            doc(db, "communityPosts", postId),
            {
              hidden: true
            }
          );
  
          alert("Post hidden successfully.");
  
          await loadReports();
  
        });
  
      });
  
    document.querySelectorAll(".restore-post-btn")
      .forEach((button) => {
  
        button.addEventListener("click", async () => {
  
          const postId =
            button.dataset.postId;
  
          if (!postId) {
            alert("Post ID missing.");
            return;
          }
  
          const confirmRestore =
            confirm("Restore this post to the community feed?");
  
          if (!confirmRestore) return;
  
          await updateDoc(
            doc(db, "communityPosts", postId),
            {
              hidden: false
            }
          );
  
          alert("Post restored successfully.");
  
          await loadReports();
  
        });
  
      });
  
    document.querySelectorAll(".delete-report-btn")
      .forEach((button) => {
  
        button.addEventListener("click", async () => {
  
          if (currentUserRole !== "superadmin") {
            alert("Only superadmins can delete reports.");
            return;
          }
  
          const confirmDelete =
            confirm("Delete this report permanently?");
  
          if (!confirmDelete) return;
  
          await deleteDoc(
            doc(db, "reports", button.dataset.id)
          );
  
          await loadReports();
  
        });
  
      });
  
  }

function formatReportType(type) {

  if (!type) return "Report";

  return type
    .split("_")
    .map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

}

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href =
      "../index.html";

  });

}
