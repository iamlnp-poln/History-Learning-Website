import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, updateProfile, Auth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  doc, 
  getDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  serverTimestamp, 
  updateDoc, 
  getDocs, 
  runTransaction, 
  arrayUnion, 
  Timestamp,
  Firestore
} from "firebase/firestore";
import { getFunctions, httpsCallable, Functions } from "firebase/functions";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  FirebaseStorage
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB7ryiXgfqAPsoHY6fZO4UZDDqe8_RQEJ4",
  authDomain: "nct-history-website-project.firebaseapp.com",
  projectId: "nct-history-website-project",
  storageBucket: "nct-history-website-project.firebasestorage.app",
  messagingSenderId: "327649860016",
  appId: "1:327649860016:web:b0e8344e2bf0ddece3de75",
  measurementId: "G-GCCWY19D6Q"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

try {
  const apps = getApps();
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0]; // Use getApp() or apps[0]
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app); 
  googleProvider = new GoogleAuthProvider();

} catch (error) {
  console.warn("Firebase initialization failed. Please check your internet connection or firebase console settings.", error);
  // Initialize with null/undefined or handle gracefully in components
  // But for exports, we need to export something. 
  // If init fails, these will likely be undefined when imported, causing crashes later.
  // Ideally, we should export a function to get these, or ensure init doesn't fail.
}

export { auth, db, functions, storage, googleProvider };

export type { FirebaseApp, Auth, Firestore, Functions, FirebaseStorage };

export { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  doc, 
  getDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  serverTimestamp, 
  updateDoc, 
  getDocs, 
  runTransaction, 
  arrayUnion, 
  Timestamp, 
  httpsCallable,
  updateProfile,
  // Storage exports
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
};