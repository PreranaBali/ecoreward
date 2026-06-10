import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDI7w6Il6kVDPkKSia7smarNweWpByW8P4",
  authDomain: "acb-flys.firebaseapp.com",
  projectId: "acb-flys",
  storageBucket: "acb-flys.firebasestorage.app",
  messagingSenderId: "950355881139",
  appId: "1:950355881139:web:5c4c64818e90c7d6be14c6",
  measurementId: "G-08EMY0HFDJ"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();