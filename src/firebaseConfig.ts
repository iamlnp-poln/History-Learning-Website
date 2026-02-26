import * as firebaseApp from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import * as firebaseFunctions from "firebase/functions";
import * as firebaseStorage from "firebase/storage";

// Workaround for module resolution issues in some environments
const appModule = firebaseApp as any;
const authModule = firebaseAuth as any;
const firestoreModule = firebaseFirestore as any;
const functionsModule = firebaseFunctions as any;
const storageModule = firebaseStorage as any;

const { initializeApp, getApps } = appModule;
const { 
  getAuth, GoogleAuthProvider, updateProfile 
} = authModule;
const { 
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
  Timestamp 
} = firestoreModule;
const { getFunctions, httpsCallable } = functionsModule;
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } = storageModule;

const firebaseConfig = {
  apiKey: "AIzaSyB7ryiXgfqAPsoHY6fZO4UZDDqe8_RQEJ4",
  authDomain: "nct-history-website-project.firebaseapp.com",
  projectId: "nct-history-website-project",
  storageBucket: "nct-history-website-project.firebasestorage.app",
  messagingSenderId: "327649860016",
  appId: "1:327649860016:web:b0e8344e2bf0ddece3de75",
  measurementId: "G-GCCWY19D6Q"
};

// Define types as any to avoid import errors if types are not resolved correctly
type FirebaseApp = any;
type Auth = any;
type Firestore = any;
type Functions = any;
type Storage = any;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: Storage;
let googleProvider: any;

try {
  const apps = getApps();
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app); 
  googleProvider = new GoogleAuthProvider();

} catch (error) {
  console.warn("Firebase initialization failed. Please check your internet connection or firebase console settings.", error);
}

export { auth, db, functions, storage, googleProvider };

export type { FirebaseApp, Auth, Firestore, Functions, Storage };

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