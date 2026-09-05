// =========================
// FIREBASE IMPORTS
// =========================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";


import {
  getAuth,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";


import {
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


import {
  getStorage,
  connectStorageEmulator
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


import {
  getFunctions,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";



// =========================
// FIREBASE CONFIG
// =========================

const firebaseConfig = {

  apiKey: "AIzaSyBKRL9hPbhFlcqg1fLEy35kZa0g_4hLEKQ",

  authDomain:
    "talentgoldplus.com",

  projectId:
    "talentgoldplus-96542",

  storageBucket:
    "talentgoldplus-96542.firebasestorage.app",

  messagingSenderId:
    "511413432305",

  appId:
    "1:511413432305:web:6cb785607c9749e3271e50"

};



// =========================
// INITIALIZE FIREBASE
// =========================

const app =
  initializeApp(
    firebaseConfig
  );



// =========================
// FIREBASE SERVICES
// =========================

const auth =
  getAuth(
    app
  );


const db =
  getFirestore(
    app
  );


const storage =
  getStorage(
    app
  );


const functions =
  getFunctions(
    app,
    "europe-west2"
  );



// =========================
// LOCAL DEVELOPMENT
// =========================

const isCapacitor =
  window.Capacitor?.isNativePlatform?.() === true;


const isLocalhost =
  !isCapacitor &&
  (
    window.location.hostname ===
      "localhost" ||
    window.location.hostname ===
      "127.0.0.1"
  );


if (
  isLocalhost
) {

  connectAuthEmulator(
    auth,
    "http://127.0.0.1:9099",
    {
      disableWarnings:
        true
    }
  );

  connectFirestoreEmulator(
    db,
    "127.0.0.1",
    8080
  );

  connectStorageEmulator(
    storage,
    "127.0.0.1",
    9199
  );

  connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    5001
  );

  console.log(
    "Connected to Firebase Emulators"
  );
}



// =========================
// EXPORTS
// =========================

export {
  app,
  auth,
  db,
  storage,
  functions
};