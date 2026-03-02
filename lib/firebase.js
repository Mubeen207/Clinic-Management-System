import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZOboZFXoHxxrXRvbq5fl60nHT2f0oxlY",
  authDomain: "clinic-mangment-system.firebaseapp.com",
  projectId: "clinic-mangment-system",
  storageBucket: "clinic-mangment-system.firebasestorage.app",
  messagingSenderId: "66254634675",
  appId: "1:66254634675:web:9ff3a6a5d975e367e27ac6",
  measurementId: "G-T8T33KNCZK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);