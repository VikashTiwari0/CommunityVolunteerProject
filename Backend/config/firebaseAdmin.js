import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../serviceAccountKey.json" with { type: "json" };

// Initialize the Firebase Admin App
const app = initializeApp({
    credential: cert(serviceAccount)
});

// Export the Auth Service instance
const auth = getAuth(app);
export default auth;