// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "firstdemo-a1e5c.firebaseapp.com",
    projectId: "firstdemo-a1e5c",
    storageBucket: "firstdemo-a1e5c.firebasestorage.app",
    messagingSenderId: "707588872254",
    appId: "1:707588872254:web:230205461de51ba0bc196f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider }