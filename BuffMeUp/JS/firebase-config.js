// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDVOlw2iyAaKWiuBtqobqqJhvkMoTZ9MtQ",
  authDomain: "buffmeup-b1282.firebaseapp.com",
  projectId: "buffmeup-b1282",
  storageBucket: "buffmeup-b1282.firebasestorage.app",
  messagingSenderId: "853251681726",
  appId: "1:853251681726:web:8d04ef6d24fcdc4b9eddef",
  measurementId: "G-22696XTHQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


