import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase web config from the original project's src/firebase.js (public client keys).
const firebaseConfig = {
  apiKey: "AIzaSyBaTgn_s6yNGVS-GvowMtlReimzQ59t1Xw",
  authDomain: "rmacts-learning-box.firebaseapp.com",
  projectId: "rmacts-learning-box",
  storageBucket: "rmacts-learning-box.firebasestorage.app",
  messagingSenderId: "46547969784",
  appId: "1:46547969784:web:bf2beccf0b6d3f9683bd0d",
  measurementId: "G-0P7PJ1CYH5",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
