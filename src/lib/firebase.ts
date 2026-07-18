// Firebase - Client-side only
// This module should only be imported from 'use client' components

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYT4CAFEewtXl3yQGOVaEaVJRAXzQqYV4",
  authDomain: "gestao-gastos-92ab3.firebaseapp.com",
  projectId: "gestao-gastos-92ab3",
  storageBucket: "gestao-gastos-92ab3.firebasestorage.app",
  messagingSenderId: "933690326242",
  appId: "1:933690326242:web:ec19a0e6251ee678a3b2bb",
  measurementId: "G-SXK5E9S458"
};

// Initialize Firebase (prevent re-initialization on hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
