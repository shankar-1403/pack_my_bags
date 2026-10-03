"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// The project's public web config (safe to ship to browsers; access is controlled by the server).
const config = {
  apiKey: "AIzaSyBAaj7kw_2HkcSj_7WhMtuuXypZU9Nna_g",
  authDomain: "pack-my-bags-1c85e.firebaseapp.com",
  projectId: "pack-my-bags-1c85e",
  storageBucket: "pack-my-bags-1c85e.firebasestorage.app",
  messagingSenderId: "997324027058",
  appId: "1:997324027058:web:bd89e5dbf71f46cb2145ab",
};

export function clientAuth() {
  return getAuth(getApps().length ? getApp() : initializeApp(config));
}
