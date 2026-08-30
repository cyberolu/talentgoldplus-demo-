let headerReady = false;

document.addEventListener("siteHeaderLoaded", () => {
  headerReady = true;
});

// =========================
// PATHS
// =========================

const isPageFolder =
  window.location.pathname.includes("/pages/");

const loginPath =
  isPageFolder
    ? "/login"
    : "/login";

const dashboardPath =
  isPageFolder
    ? "/dashboard"
    : "/dashboard";

const homePath =
  isPageFolder
    ? "/"
    : "/";

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// =========================
// PAGE CHECKS
// =========================

const protectedPages = [
  "/dashboard",
  "/dashboard",
  "/profile-setup",
  "/community",
  "/connections",
  "/messages",
  "/notifications",
  "/create-listing"
];

const isProtectedPage =
  protectedPages.some((page) =>
    window.location.pathname.includes(page)
  );

  const isDashboardPage =
    window.location.pathname.includes("/dashboard") ||
    window.location.pathname.includes("/dashboard");

// =========================
// REGISTER
// =========================

const registerForm =
  document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name =
      document.getElementById("name").value.trim();

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    const role =
      document.getElementById("role").value || "athlete";

    const category =
      document.getElementById("category")?.value || "";

    try {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          email,
          role,
          category,
          profileCompleted: false,
          createdAt: new Date()
        }
      );

      alert("Account created successfully.");

      window.location.href =
        "/dashboard";

    } catch (error) {

      alert(error.message);

    }

  });

}

// =========================
// LOGIN
// =========================

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      window.location.href =
        "/dashboard";

    } catch (error) {

      alert(error.message);

    }

  });

}

// =========================
// FORGOT PASSWORD
// =========================

const forgotPasswordLink =
  document.getElementById("forgotPasswordLink");

if (forgotPasswordLink) {

  forgotPasswordLink.addEventListener("click", async (e) => {

    e.preventDefault();

    const email =
      document.getElementById("email").value.trim();

    if (!email) {

      alert("Please enter your email address first.");

      return;

    }

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      alert(
        "Password reset email sent.\n\nPlease check your Inbox and Spam/Junk folder.\n\nIf you do not receive the email within a few minutes, verify that the email address is correct and try again."
      );

    } catch (error) {

      alert(error.message);

    }

  });

}

// =========================
// GOOGLE LOGIN
// =========================

const googleLoginBtn =
  document.getElementById("googleLoginBtn");

if (googleLoginBtn) {

  googleLoginBtn.addEventListener("click", async () => {

    try {

      const provider =
        new GoogleAuthProvider();

      const result =
        await signInWithPopup(auth, provider);

      const user =
        result.user;

      const userRef =
        doc(db, "users", user.uid);

      const userSnap =
        await getDoc(userRef);

      if (!userSnap.exists()) {

        await setDoc(
          userRef,
          {
            name: user.displayName || "User",
            email: user.email,
            role: "athlete",
            category: "",
            profileImage: user.photoURL || "",
            profileCompleted: false,
            createdAt: new Date()
          }
        );

      }

      window.location.href =
        "/dashboard";

    } catch (error) {

      alert(error.message);

    }

  });

}

// =========================
// LOGOUT BUTTONS
// =========================

function setupLogoutButton(buttonId) {

  const button =
    document.getElementById(buttonId);

  if (!button) return;

  button.addEventListener("click", async (e) => {

    e.preventDefault();

    try {

      await signOut(auth);

      window.location.href =
        homePath;

    } catch (error) {

      alert(error.message);

    }

  });

}

setupLogoutButton("logoutBtn");
setupLogoutButton("mobileLogoutBtn");

// =========================
// DASHBOARD ELEMENTS
// =========================

const welcomeMessage =
  document.getElementById("welcomeMessage");

const roleText =
  document.getElementById("roleText");

const dashboardCards =
  document.getElementById("dashboardCards");

const profilePreview =
  document.getElementById("profilePreview");

const dashboardNav =
  document.getElementById("dashboardNav");

const dashboardName =
  document.getElementById("dashboardName");

const dashboardAvatar =
  document.getElementById("dashboardAvatar");

const profileCompletion =
  document.getElementById("profileCompletion");

const connectionsCount =
  document.getElementById("connectionsCount");

const messagesCount =
  document.getElementById("messagesCount");

const listingsCount =
  document.getElementById("listingsCount");

const mediaCount =
  document.getElementById("mediaCount");

// =========================
// GLOBAL NAVBAR AUTH
// =========================

  function waitForHeader() {
    return new Promise((resolve) => {
      if (document.getElementById("authNavItem")) {
        resolve();
        return;
      }
  
      document.addEventListener("siteHeaderLoaded", () => {
        resolve();
      }, { once: true });
    });
  }

// =========================
// AUTH STATE
// =========================

onAuthStateChanged(auth, async (user) => {

  if (document.getElementById("siteHeader")) {
    await waitForHeader();
  }

  if (!user && isProtectedPage) {


    window.location.href =
      loginPath;

    return;

  }

  if (!user) {

    updatePublicNavbar(false);
  
    document.body.style.display = "block";
  
    return;
  
  }

  

  const userRef =
    doc(db, "users", user.uid);

    const userSnap =
    await getDoc(userRef);
  
  
  if (!userSnap.exists()) {
  
    console.error(
      "User document does not exist"
    );
  
    return;
  
  }
  
  const userData =
  userSnap.data();

/* =========================
   ACCOUNT STATUS CHECK
========================= */

const accountStatus =
  (userData.status || "active").toLowerCase();

if (accountStatus !== "active") {

  let message =
    "Your TalentGoldPlus account is currently unavailable.";

  switch (accountStatus) {

    case "pending":
      message =
        "Your account is awaiting approval. Please check back later.";
      break;

    case "under-review":
      message =
        "Your account is currently under review. Please contact TalentGoldPlus if you require further information.";
      break;

    case "suspended":
      message =
        "Your account has been suspended. Please contact TalentGoldPlus support if you believe this is an error.";
      break;

    case "banned":
      message =
        "Your account has been permanently restricted from using TalentGoldPlus.";
      break;

  }

  alert(message);

  await signOut(auth);

  window.location.href =
    isAuthPage ? "/login" : "/login";

  return;

}

updatePublicNavbar(true, userData);

listenForNotifications(user.uid);

document.body.style.display = "block";

if (isDashboardPage) {

  renderDashboard(userData);

}

});

// =========================
// PUBLIC NAVBAR
// =========================

function updatePublicNavbar(isLoggedIn, userData = null) {

const authNavItem =
  document.getElementById("authNavItem");

const joinBtn =
  document.getElementById("joinBtn");

const notificationsNavItem =
  document.getElementById("notificationsNavItem");

  if (isLoggedIn) {

  if (notificationsNavItem) {
    notificationsNavItem.style.display = "block";
  }

    const name =
      userData?.fullName ||
      userData?.name ||
      "User";

    const profileImage =
      userData?.profileImage &&
      userData.profileImage.startsWith("http")
        ? userData.profileImage
        : "";

    const userAvatar =
      profileImage
        ? `
          <img
            src="${profileImage}"
            alt="${name}"
            class="nav-user-avatar"
            onerror="this.outerHTML='<span class=&quot;nav-user-initials&quot;>${getInitials(name)}</span>'"
          >
        `
        : `
          <span class="nav-user-initials">
            ${getInitials(name)}
          </span>
        `;

    if (authNavItem) {

      authNavItem.innerHTML = `
        <div class="nav-user-menu">

          <button
            class="nav-user-toggle"
            id="navUserToggle"
            type="button"
          >
            ${userAvatar}

            <span class="nav-user-name">
              ${name}
            </span>

            <span class="nav-user-arrow">▼</span>
          </button>

          <div class="nav-user-dropdown" id="navUserDropdown">

            <a href="${dashboardPath}">
              Dashboard
            </a>

            <a href="${isPageFolder ? "/profile-setup" : "pages//profile-setup"}">
              My Profile
            </a>

            <a href="${isPageFolder ? "/messages" : "pages//messages"}">
              Messages
            </a>

            <a href="${isPageFolder ? "/notifications" : "pages//notifications"}">
              Notifications
            </a>

            <button id="publicLogoutBtn">
              Logout
            </button>

          </div>

        </div>
      `;

setupLogoutButton("publicLogoutBtn");
setupUserDropdown();

      

    }

    document.querySelectorAll("#joinBtn").forEach((btn) => {
      btn.style.display = "none";
    });

  } else {

    if (notificationsNavItem) {
      notificationsNavItem.style.display = "none";
    }
  
    if (authNavItem) {
  
      authNavItem.innerHTML = `
        <a href="${loginPath}">
          Login
        </a>
      `;
  
    }
  
    document.querySelectorAll("#joinBtn").forEach((btn) => {
      btn.style.display = "inline-block";
    });
  
  }

}

function setupUserDropdown() {

  const toggle =
    document.getElementById("navUserToggle");

  const dropdown =
    document.getElementById("navUserDropdown");

  if (!toggle || !dropdown) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("active");
  });

}
// =========================
// DASHBOARD RENDER
// =========================

function renderDashboard(userData) {

  const role =
    userData.role || "athlete";

  const name =
    userData.fullName ||
    userData.name ||
    "User";

  const sport =
    userData.sport ||
    userData.category ||
    "";

  const location =
    userData.location ||
    "";

  const completed =
    userData.profileCompleted
      ? "Complete"
      : "Incomplete";

  const hasProfileImage =
    userData.profileImage &&
    userData.profileImage.startsWith("http");

  const profileImage =
    hasProfileImage
      ? userData.profileImage
      : "";

  const sidebarAvatarHtml =
    hasProfileImage
      ? `
        <img
          src="${profileImage}"
          alt="${name}"
          class="portal-user-avatar"
          onerror="this.outerHTML='<div class=&quot;portal-user-avatar initials-avatar&quot;>${getInitials(name)}</div>'"
        >
      `
      : `
        <div class="portal-user-avatar initials-avatar">
          ${getInitials(name)}
        </div>
      `;

  if (welcomeMessage) {
    welcomeMessage.textContent =
      name;
  }

  if (dashboardName) {
    dashboardName.textContent =
      name;
  }

  if (dashboardAvatar) {
    dashboardAvatar.textContent =
      getInitials(name);
  }

  if (roleText) {
    roleText.innerHTML = `
      <strong>Role:</strong> ${role}<br>
      <strong>Sport/Category:</strong> ${sport || "Not set"}<br>
      <strong>Location:</strong> ${location || "Not set"}<br>
      <strong>Profile:</strong> ${completed}
    `;
  }

  if (profileCompletion) {
    profileCompletion.textContent =
      `${calculateProfileStrength(userData)}%`;
  }

  if (connectionsCount) {
    connectionsCount.textContent = "0";
  }

  if (messagesCount) {
    messagesCount.textContent = "0";
  }

  if (listingsCount) {
    listingsCount.textContent = "0";
  }

  if (profilePreview) {
    profilePreview.innerHTML = `
      <div class="dashboard-profile-card">
        ${sidebarAvatarHtml}

        <div>
          <h3>${name}</h3>
          <p>${role}</p>
          <p>${sport || "No category set"}</p>
        </div>
      </div>
    `;
  }

  renderDashboardNav(role);

  renderDashboardCards(role);

  loadDashboardStats(auth.currentUser.uid);
  listenForNotifications(auth.currentUser.uid);

}
// =========================
// DASHBOARD NAV
// =========================

function renderDashboardNav(role) {

  if (!dashboardNav) return;

  const userId =
    auth.currentUser?.uid;

  dashboardNav.innerHTML = `
    <a href="/dashboard" class="active">Dashboard</a>
    <a href="/profile?user=${userId}">View My Profile</a>
    <a href="/profile-setup">Edit Profile</a>
    <a href="/media">My Media</a>
    <a href="/community">Community</a>
    <a href="/connections">Connections</a>
    <a href="/messages">Messages</a>
    <a href="/marketplace">Marketplace</a>
    <a href="/notifications">Notifications</a>

    ${
      role === "admin" ||
      role === "superadmin"
        ? `<a href="../admin//">Admin</a>`
        : ""
    }
  `;

}

// =========================
// DASHBOARD CARDS
// =========================

function renderDashboardCards(role) {

  if (!dashboardCards) return;

  dashboardCards.innerHTML = "";

  const commonCards = `
    <a href="/profile?user=${auth.currentUser?.uid}" class="dashboard-card-link">
      <div class="athlete-card">
        <div class="athlete-info">
          <h3>View My Profile</h3>
          <p>See how your public profile appears to others.</p>
        </div>
      </div>
    </a>

    <a href="/community" class="dashboard-card-link">
      <div class="athlete-card">
        <div class="athlete-info">
          <h3>Community</h3>
          <p>Connect with athletes, coaches and professionals.</p>
        </div>
      </div>
    </a>

    <a href="/marketplace" class="dashboard-card-link">
      <div class="athlete-card">
        <div class="athlete-info">
          <h3>Marketplace</h3>
          <p>Find services, opportunities and support.</p>
        </div>
      </div>
    </a>

    <a href="/messages" class="dashboard-card-link">
      <div class="athlete-card">
        <div class="athlete-info">
          <h3>Messages</h3>
          <p>Communicate with your network.</p>
        </div>
      </div>
    </a>
  `;

  

  const adminCards = `
    <a href="../admin//" class="dashboard-card-link">
      <div class="athlete-card">
        <div class="athlete-info">
          <h3>Admin Panel</h3>
          <p>Manage users, approvals and platform settings.</p>
        </div>
      </div>
    </a>
  `;

  dashboardCards.innerHTML =
  commonCards +
  (
    role === "admin" ||
    role === "superadmin"
      ? adminCards
      : ""
  );

}

// =========================
// HELPERS
// =========================

function getInitials(name) {

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

}
async function loadDashboardStats(userId) {

  try {

    const sentConnections =
      await getDocs(
        query(
          collection(db, "connections"),
          where("senderId", "==", userId),
          where("status", "==", "accepted")
        )
      );

    const receivedConnections =
      await getDocs(
        query(
          collection(db, "connections"),
          where("receiverId", "==", userId),
          where("status", "==", "accepted")
        )
      );

    const totalConnections =
      sentConnections.size +
      receivedConnections.size;

    if (connectionsCount) {
      connectionsCount.textContent =
        totalConnections;
    }

    const conversationsSnapshot =
      await getDocs(
        query(
          collection(db, "conversations"),
          where("participants", "array-contains", userId)
        )
      );

    if (messagesCount) {
      messagesCount.textContent =
        conversationsSnapshot.size;
    }

    const listingsSnapshot =
      await getDocs(
        query(
          collection(db, "marketplaceListings"),
          where("userId", "==", userId)
        )
      );

    if (listingsCount) {
      listingsCount.textContent =
        listingsSnapshot.size;
    }

    const mediaSnapshot =
      await getDocs(
        query(
          collection(db, "userMedia"),
          where("userId", "==", userId)
        )
      );

    if (mediaCount) {
      mediaCount.textContent =
        mediaSnapshot.size;
    }
    const notificationsSnapshot =
      await getDocs(
        query(
          collection(db, "notifications"),
          where("userId", "==", userId),
          where("read", "==", false)
        )
      );

    const notificationsCount =
      document.getElementById("notificationsCount");

    if (notificationsCount) {
      notificationsCount.textContent =
        notificationsSnapshot.size;
    }

  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error
    );

  }

}
function listenForNotifications(userId) {

  const notificationsQuery =
    query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

  onSnapshot(notificationsQuery, (snapshot) => {

    const notificationsCount =
      document.getElementById("notificationsCount");

    if (notificationsCount) {
      notificationsCount.textContent =
        snapshot.size;
    }

  });

}
function calculateProfileStrength(userData) {

  const checks = [
    !!(userData.fullName || userData.name),
    !!userData.location,
    !!userData.bio,
    !!(
      userData.profileImage &&
      userData.profileImage.startsWith("http")
    )
  ];

  if (userData.role === "athlete") {
    checks.push(
      !!userData.sport,
      !!userData.pbs,
      !!userData.achievements
    );
  }

  if (userData.role === "professional") {
    checks.push(
      !!userData.professionalCategory,
      !!userData.qualifications,
      !!userData.services
    );
  }

  const completed =
    checks.filter(Boolean).length;

  return Math.round(
    (completed / checks.length) * 100
  );

}
