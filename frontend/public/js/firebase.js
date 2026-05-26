
// FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import { 
  getAuth 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { 
  getFirestore 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";


// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBKRL9hPbhFlcqg1fLEy35kZa0g_4hLEKQ",
    authDomain: "talentgoldplus-96542.firebaseapp.com",
    projectId: "talentgoldplus-96542",
    storageBucket:"talentgoldplus-96542.appspot.com",
    messagingSenderId: "511413432305",
    appId: "1:511413432305:web:6cb785607c9749e3271e50"
};


// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);


// SERVICES
const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


// EXPORTS
export { auth, db, storage };