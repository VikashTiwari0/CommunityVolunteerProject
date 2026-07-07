import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { auth, provider } from "../utils/firebase";
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

const AuthContext = createContext();

// Create configured axios instance with credentials enabled for HTTP-only cookies
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user on mount (verifies session cookie)
    const fetchUser = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data.user);
        } catch (err) {
            console.warn("Session check failed (no active cookie session):", err.message);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // Local Login
    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.error("Login failed:", err);
            return {
                success: false,
                message: err.response?.data?.message || "Login failed. Please check your credentials."
            };
        } finally {
            setLoading(false);
        }
    };

    // Local Registration
    const register = async (userData) => {
        setLoading(true);
        try {
            const res = await api.post("/auth/register", userData);
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.error("Registration failed:", err);
            return {
                success: false,
                message: err.response?.data?.message || "Registration failed. Please try again."
            };
        } finally {
            setLoading(false);
        }
    };

    // Google Sign-In via Firebase
    const loginWithGoogle = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            // Send firebase token to MERN backend
            const res = await api.post("/auth/google", { idToken });
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            console.error("Google Sign-In failed:", err);
            return {
                success: false,
                message: err.response?.data?.message || err.message || "Google Sign-In failed."
            };
        } finally {
            setLoading(false);
        }
    };

    // Logout (clears session cookie on backend)
    const logout = async () => {
        setLoading(true);
        try {
            if (auth.currentUser) {
                await firebaseSignOut(auth);
            }
            await api.post("/auth/logout");
        } catch (err) {
            console.error("Logout request error:", err);
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    // Update Profile
    const updateProfile = async (updates) => {
        if (!user) return { success: false, message: "No user logged in" };
        try {
            const res = await api.patch(`/volunteers/${user._id}`, updates);
            setUser(res.data.volunteer);
            return { success: true, volunteer: res.data.volunteer };
        } catch (err) {
            console.error("Update profile error:", err);
            return {
                success: false,
                message: err.response?.data?.message || "Update profile failed."
            };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                loginWithGoogle,
                logout,
                updateProfile,
                checkSession: fetchUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
