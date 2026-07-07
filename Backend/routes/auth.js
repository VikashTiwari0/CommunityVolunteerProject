import express from "express";
import User from "../models/User.js";
import auth from "../config/firebaseAdmin.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * Reusable helper to sign JWT, set HTTP-Only cookie, and respond with user details.
 */
const sendTokenCookie = (user, statusCode, res) => {
    const token = user.generateJWT();

    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax"
    };

    res.status(statusCode)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                photo: user.photo,
                phone: user.phone,
                location: user.location,
                skills: user.skills,
                interests: user.interests,
                availability: user.availability,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
};

// @desc    Register a new user (Local)
// @route   POST /auth/register
// @access  Public
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, phone, location, skills, interests, availability } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists with this email" });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password, // Will be encrypted in pre-save hook
            role: role || "Volunteer",
            phone: phone || "",
            location: location || "",
            skills: skills || [],
            interests: interests || [],
            availability: availability || "Weekends",
            isVerified: false
        });

        sendTokenCookie(user, 201, res);
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Login user (Local)
// @route   POST /auth/login
// @access  Public
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }

        // Check for user
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        sendTokenCookie(user, 200, res);
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Google OAuth login/signup
// @route   POST /auth/google
// @access  Public
router.post("/google", async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: "Please provide a Google ID Token" });
        }

        // Verify Firebase ID Token
        const decodedToken = await auth.verifyIdToken(idToken);
        const { name, email, picture, uid } = decodedToken;

        // Find user by email
        let user = await User.findOne({ email });

        if (!user) {
            // User does not exist, sign them up
            user = await User.create({
                name: name || email.split("@")[0],
                email,
                photo: picture || "",
                firebaseUid: uid,
                role: "Volunteer", // Default role
                isVerified: true
            });
        } else {
            // User exists, update Firebase UID and photo if they aren't linked yet
            user.firebaseUid = uid;
            if (!user.photo && picture) {
                user.photo = picture;
            }
            await user.save();
        }

        sendTokenCookie(user, 200, res);
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ success: false, message: "Google Authentication failed: " + error.message });
    }
});

// @desc    Get current user profile
// @route   GET /auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error("Auth Me Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Logout user (clears token cookie)
// @route   POST /auth/logout
// @access  Private
router.post("/logout", protect, async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

export default router;
