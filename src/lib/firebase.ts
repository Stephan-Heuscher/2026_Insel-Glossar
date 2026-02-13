"use client";

import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// TODO: Replace with your new Firebase project config after creating it at https://console.firebase.google.com
const firebaseConfig = {
    apiKey: "AIzaSyAi_3oab6vLxNfDiyH8UNkR3sKO8hARQkk",
    authDomain: "geburtstags-wimmelbuch.firebaseapp.com",
    projectId: "geburtstags-wimmelbuch",
    storageBucket: "geburtstags-wimmelbuch.firebasestorage.app",
    messagingSenderId: "187010280270",
    appId: "1:187010280270:web:4c02dcb7a401de3f908c1f",
    measurementId: "G-6P9G7L95P3"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const functions = getFunctions(app);

export { app, db, storage, auth, functions };
