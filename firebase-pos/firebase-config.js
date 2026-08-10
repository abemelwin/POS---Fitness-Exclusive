/**
 * FIREBASE CONFIGURATION - Fitness Exclusive POS
 */

const firebaseConfig = {
  apiKey: "AIzaSyBjpXe_hznACr72OB-GKDiVu5NryDvjasI",
  authDomain: "es-print-group.firebaseapp.com",
  projectId: "es-print-group",
  storageBucket: "es-print-group.firebasestorage.app",
  messagingSenderId: "326384419155",
  appId: "1:326384419155:web:6df3cc715db07df611a1a6",
  measurementId: "G-509WP8C00B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Collections references
const salesRef = db.collection('sales');
const stockInRef = db.collection('stockIn');
const collectionsRef = db.collection('collections');
const inventoryRef = db.collection('inventory');
const configRef = db.collection('config');
