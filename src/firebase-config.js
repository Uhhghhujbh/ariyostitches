import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD6fQZOJcTUlKleBonHoHTSRDxbyO6VqDI",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ariyostitches-1ad08.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ariyostitches-1ad08",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ariyostitches-1ad08.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "81940985924",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:81940985924:web:9c66c7f7b2dd8e0b7da411"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;