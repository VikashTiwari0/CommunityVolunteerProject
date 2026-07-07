import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
    let token;

    // Check for cookie token first
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // Fallback to Bearer token in header
    else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token || token === "none") {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretjwtkeyforunityhubvolunteerportal2026");

        // Get user from the token and attach to request
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authorized, user not found" });
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};

// Grant access to specific roles (e.g. Admin)
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user?.role || "none"}' is not authorized to access this route`
            });
        }
        next();
    };
};
