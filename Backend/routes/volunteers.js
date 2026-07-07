import express from "express";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// @desc    Get all volunteers
// @route   GET /volunteers
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        let volunteers;
        if (req.user.role === "Admin") {
            // Admin sees everyone
            volunteers = await User.find({ role: "Volunteer" }).select("-password");
        } else {
            // Volunteer sees active community members (excluding sensitive fields)
            volunteers = await User.find({ role: "Volunteer", isVerified: true })
                .select("name photo skills interests location availability");
        }
        res.status(200).json({ success: true, count: volunteers.length, volunteers });
    } catch (error) {
        console.error("Get Volunteers Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get single volunteer by ID
// @route   GET /volunteers/:id
// @access  Private (Admin or Self)
router.get("/:id", protect, async (req, res) => {
    try {
        const volunteer = await User.findById(req.params.id).select("-password");

        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found" });
        }

        // Allow Admin, or the volunteer themselves to access
        if (req.user.role !== "Admin" && req.user._id.toString() !== volunteer._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access to profile" });
        }

        res.status(200).json({ success: true, volunteer });
    } catch (error) {
        console.error("Get Volunteer Detail Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Update volunteer profile
// @route   PATCH /volunteers/:id
// @access  Private (Admin or Self)
router.patch("/:id", protect, upload.single("photo"), async (req, res) => {
    try {
        let volunteer = await User.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found" });
        }

        // Restrict updates: only self or Admin
        if (req.user.role !== "Admin" && req.user._id.toString() !== volunteer._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized update of profile" });
        }

        // Handle profile image file upload
        if (req.file) {
            // Delete old photo from Cloudinary if it exists
            if (volunteer.photoPublicId) {
                await deleteFromCloudinary(volunteer.photoPublicId);
            }
            const uploadResult = await uploadToCloudinary(req.file.path);
            if (uploadResult) {
                volunteer.photo = uploadResult.secure_url;
                volunteer.photoPublicId = uploadResult.public_id;
            }
        } else if (req.body.photo === "") {
            // User requested to remove profile photo, fall back to default unfaced silhouette
            if (volunteer.photoPublicId) {
                await deleteFromCloudinary(volunteer.photoPublicId);
            }
            volunteer.photo = "";
            volunteer.photoPublicId = "";
        }

        // Fields that anyone can update (self or admin)
        const fieldsToUpdate = [
            "name",
            "phone",
            "location",
            "skills",
            "interests",
            "availability"
        ];



        fieldsToUpdate.forEach((field) => {
            if (req.body[field] !== undefined) {
                if ((field === "skills" || field === "interests") && typeof req.body[field] === "string") {
                    try {
                        volunteer[field] = JSON.parse(req.body[field]);
                    } catch (e) {
                        volunteer[field] = req.body[field].split(",").map(s => s.trim()).filter(Boolean);
                    }
                } else {
                    volunteer[field] = req.body[field];
                }
            }
        });

        // Admin-only updates (like verification/approval and role changes)
        if (req.user.role === "Admin") {
            if (req.body.isVerified !== undefined) {
                volunteer.isVerified = req.body.isVerified;
            }
            if (req.body.role !== undefined) {
                volunteer.role = req.body.role;
            }
        }

        await volunteer.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            volunteer
        });
    } catch (error) {
        console.error("Update Volunteer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Delete volunteer
// @route   DELETE /volunteers/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
    try {
        const volunteer = await User.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found" });
        }

        // Delete profile photo from Cloudinary if it exists
        if (volunteer.photoPublicId) {
            await deleteFromCloudinary(volunteer.photoPublicId);
        }

        await volunteer.deleteOne();

        res.status(200).json({ success: true, message: "Volunteer profile and photo deleted successfully" });
    } catch (error) {
        console.error("Delete Volunteer Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
