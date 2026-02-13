"use client";

import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCW34kPaNI7ruFlEfy9j4X6DPM0mgRunKw",
    authDomain: "insel-glossar.firebaseapp.com",
    projectId: "insel-glossar",
    storageBucket: "insel-glossar.firebasestorage.app",
    messagingSenderId: "1049814310953",
    appId: "1:1049814310953:web:578b810852e38396b27c38",
    measurementId: "G-3NXPJR6C0H"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const functions = getFunctions(app);

export { app, db, storage, auth, functions };
