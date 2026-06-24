/* C:\Users\Reyhan\Documents\spk\config.js */

// Firebase Configuration. Replace placeholders with your own project credentials.
const firebaseConfig = {
    apiKey: "AIzaSyB58MvUGBDRSfCH0-APMAAbrFZRHdKc9Ds",
    authDomain: "spkdb-d497b.firebaseapp.com",
    projectId: "spkdb-d497b",
    storageBucket: "spkdb-d497b.firebasestorage.app",
    messagingSenderId: "573467223962",
    appId: "1:573467223962:web:ac8893d10a438702f0bc23",
    measurementId: "G-GX2TBKPRYV"
};

// Set to true to use Firebase, or false to force Local Storage (Offline Mode)
const enableFirebase = true;

// Flags to control if we should use Firebase or local storage fallback
window.useFirebase = false;

// Check if credentials have been replaced
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (enableFirebase && isConfigured) {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        // Connect to the specific database instance named 'spkDB'
        window.db = firebase.app().firestore();
        window.auth = firebase.auth();
        try {
            if (typeof firebase.storage === 'function') {
                window.storage = firebase.storage();
            }
        } catch (e) {
            console.warn("Firebase storage is not supported or not loaded:", e);
        }
        window.useFirebase = true;
        console.log("Firebase initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize Firebase, falling back to Local Storage:", error);
    }
} else {
    console.warn("Firebase not configured. Falling back to Local Storage (Offline Mode). Please configure config.js to use Firebase.");
}
