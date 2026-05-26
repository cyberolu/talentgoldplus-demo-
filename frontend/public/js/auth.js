import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    GoogleAuthProvider,
    signInWithPopup
  } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    onAuthStateChanged,
    signOut
    } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// =========================
// REGISTER
// =========================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value;

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    const role = document.getElementById("role").value;

    try {

      // CREATE USER
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      // SAVE USER TO FIRESTORE
      await setDoc(doc(db, "users", user.uid), {

        name: name,
        email: email,
        role: role,
        createdAt: new Date()

      });

      alert("Account created successfully!");

      // REDIRECT
      window.location.href = "../pages/dashboard.html";

    } catch (error) {

      alert(error.message);

    }

  });

}


// =========================
// LOGIN
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login successful!");

      window.location.href = "../pages/dashboard.html";

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

      const provider = new GoogleAuthProvider();

      const result =
        await signInWithPopup(auth, provider);

        const user = result.user;


        // SAVE USER TO FIRESTORE
        const userRef =
  doc(db, "users", user.uid);

const userSnap =
  await getDoc(userRef);


// ONLY CREATE USER IF NEW
if (!userSnap.exists()) {

  await setDoc(userRef, {

    name: user.displayName || "User",

    email: user.email,

    role: "athlete",

    profileImage: user.photoURL || "",

    createdAt: new Date()

  });

}
        
        
        alert("Google login successful!");
        
        window.location.href = "../pages/dashboard.html";

    } catch (error) {

      alert(error.message);

    }

  });

}
  
  
  // =========================
  // LOGOUT
  // =========================
  
  const logoutBtn =
    document.getElementById("logoutBtn");
  
  if (logoutBtn) {
  
    logoutBtn.addEventListener("click", async () => {
  
      try {
  
        await signOut(auth);
  
        alert("Logged out successfully!");
  
        window.location.href = "../index.html";
  
      } catch (error) {
  
        alert(error.message);
  
      }
  
    });
  
  }
  // =========================
// DASHBOARD SYSTEM
// =========================

const welcomeMessage =
  document.getElementById("welcomeMessage");

const roleText =
  document.getElementById("roleText");

const dashboardCards =
  document.getElementById("dashboardCards");

const isDashboardPage =
  window.location.pathname.includes("dashboard.html");

const isProfilePage =
  window.location.pathname.includes("profile-setup.html");

const dashboardNav =
  document.getElementById("dashboardNav");

const isCommunityPage =
  window.location.pathname.includes("community.html");


onAuthStateChanged(auth, async (user) => {



  if (!user && (isDashboardPage || isProfilePage)) {

    window.location.href = "../auth/login.html";
  
    return;
  }

  if (!dashboardCards) return;
  document.body.style.display = "block";

  try {

    const userRef =
      doc(db, "users", user.uid);

    const userSnap =
      await getDoc(userRef);

    if (userSnap.exists()) {

      const userData = userSnap.data();

      const role = userData.role;

      const name =
        userData.name ||
        userData.fullName ||
        "User";


      // WELCOME
      welcomeMessage.textContent =
        `Welcome ${name}`;

      roleText.textContent =
        `Role: ${role}`;


      // CLEAR
      dashboardCards.innerHTML = "";


      // =========================
      // SUPERADMIN
      // =========================

      if (role === "superadmin") {
        
        dashboardNav.innerHTML = `

          <li><a href="dashboard.html">Dashboard</a></li>

          <li><a href="community.html">Community</a></li>

          <li><a href="marketplace.html">Marketplace</a></li>

          <li><a href="profile-setup.html">Profile</a></li>

          <li><a href="#">Admin Panel</a></li>

        `;
        dashboardCards.innerHTML = `

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>Admin Panel</h3>
              <p>Manage platform users and approvals.</p>
            </div>
          </div>

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>Marketplace Control</h3>
              <p>Manage listings and commissions.</p>
            </div>
          </div>

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>Community Moderation</h3>
              <p>Review reports and content.</p>
            </div>
          </div>

        `;

      }


      // =========================
      // ATHLETE
      // =========================

      else if (role === "athlete") {

        dashboardNav.innerHTML = `

          <li><a href="dashboard.html">Dashboard</a></li>

          <li><a href="community.html">Community</a></li>

          <li><a href="marketplace.html">Marketplace</a></li>

          <li><a href="profile-setup.html">Profile</a></li>

        `;

        dashboardCards.innerHTML = `

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>My Profile</h3>
              <p>Manage your athlete profile.</p>
            </div>
          </div>

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>Upload Media</h3>
              <p>Share videos and achievements.</p>
            </div>
          </div>

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>Marketplace</h3>
              <p>Access services and opportunities.</p>
            </div>
          </div>

        `;

      }


      // =========================
      // COACH
      // =========================

      else if (role === "coach") {

        dashboardCards.innerHTML = `

          <div class="athlete-card">
            <div class="athlete-info">
              <h3>Coaching Programmes</h3>
              <p>Manage athlete coaching services.</p>
            </div>
          </div>

        `;

      }

    }

  } catch (error) {

    console.error(error);

  }

});
// =========================
// GLOBAL NAVBAR AUTH
// =========================

const authNavItem =
  document.getElementById("authNavItem");

const joinBtn =
  document.getElementById("joinBtn");


onAuthStateChanged(auth, async (user) => {

  if (user) {


    // DASHBOARD LINK
    if (authNavItem) {

      authNavItem.innerHTML = `

      <div class="auth-links">

        <a href="dashboard.html">
          Dashboard
        </a>

        <button id="publicLogoutBtn"
                class="btn-primary logout-btn">

          Logout

        </button>

      </div>

    `;
    }


    // HIDE JOIN BUTTON
    document.querySelectorAll("#joinBtn").forEach((btn) => {

      btn.style.display = "none";
    
    });


    // LOGOUT
    const publicLogoutBtn =
      document.getElementById("publicLogoutBtn");

    if (publicLogoutBtn) {

      publicLogoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        await signOut(auth);

        authNavItem.innerHTML = `
          <a href="../auth/login.html">
            Login
          </a>
        `;

        document.querySelectorAll("#joinBtn").forEach((btn) => {

          btn.style.display = "inline-block";

        });

        window.location.href = "../index.html";

      });

    }

  } else {

  
    if (isCommunityPage) {

      alert("Please login or create an account to access the community.");
    
      window.location.href = "../auth/login.html";
    
      return;
    
    }

    // LOGIN LINK
    if (authNavItem) {
  
      authNavItem.innerHTML = `
        <a href="../auth/login.html">
          Login
        </a>
      `;
    }
  
    // SHOW JOIN BUTTON
    document.querySelectorAll("#joinBtn").forEach((btn) => {
  
      btn.style.display = "inline-block";
  
    });
  
  }
});