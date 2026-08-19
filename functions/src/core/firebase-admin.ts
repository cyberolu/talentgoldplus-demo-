import {getApps, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

const app =
  getApps().length > 0 ?
    getApps()[0] :
    initializeApp();

const db =
  getFirestore(app);

const adminAuth =
  getAuth(app);

export {
  app,
  db,
  adminAuth,
};
