import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBZOboZFXoHxxrXRvbq5fl60nHT2f0oxlY",
  authDomain: "clinic-mangment-system.firebaseapp.com",
  projectId: "clinic-mangment-system",
  storageBucket: "clinic-mangment-system.firebasestorage.app",
  messagingSenderId: "66254634675",
  appId: "1:66254634675:web:9ff3a6a5d975e367e27ac6",
  measurementId: "G-T8T33KNCZK"
};

// Initialize Firebase only if it hasn't been initialized already (fixes SSR issues)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
