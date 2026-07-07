import express from "express";
import Attendance from "../models/Attendance.js";
import Registration from "../models/Registration.js";
import Campaign from "../models/Campaign.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @desc    Admin marks attendance for a volunteer
// @route   POST /attendance
// @access  Private (Admin only)
router.post("/", protect, authorize("Admin"), async (req, res) => {
    try {
        const { volunteerId, campaignId, status } = req.body;

        if (!volunteerId || !campaignId || !status) {
            return res.status(400).json({ success: false, message: "Please provide volunteerId, campaignId, and status" });
        }

        if (!["Present", "Absent", "Late"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        // Verify volunteer is registered
        const reg = await Registration.findOne({ volunteerId, campaignId });
        if (!reg) {
            return res.status(400).json({ success: false, message: "Volunteer is not registered for this campaign" });
        }

        // Update or create attendance record
        let attendance = await Attendance.findOne({ volunteerId, campaignId });

        if (attendance) {
            attendance.present = status === "Present" || status === "Late";
            attendance.status = status;
            attendance.checkInTime = status !== "Absent" ? new Date() : undefined;
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                volunteerId,
                campaignId,
                present: status === "Present" || status === "Late",
                status,
                checkInTime: status !== "Absent" ? new Date() : undefined
            });
        }

        res.status(200).json({ success: true, message: "Attendance marked successfully", attendance });
    } catch (error) {
        console.error("Mark Attendance Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Volunteer self check-in via QR Scanner (mocks scanning campaign QR code)
// @route   POST /attendance/checkin
// @access  Private (Volunteer only)
router.post("/checkin", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const { campaignId } = req.body;

        if (!campaignId) {
            return res.status(400).json({ success: false, message: "Please provide campaignId" });
        }

        // Verify campaign is active/ongoing
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        // Verify registration
        const registration = await Registration.findOne({
            volunteerId: req.user._id,
            campaignId,
            status: "Accepted"
        });

        if (!registration) {
            return res.status(403).json({ success: false, message: "You are not an approved volunteer for this campaign" });
        }

        // Log attendance
        let attendance = await Attendance.findOne({ volunteerId: req.user._id, campaignId });

        if (attendance) {
            if (attendance.present) {
                return res.status(400).json({ success: false, message: "You are already checked in for this campaign" });
            }
            attendance.present = true;
            attendance.status = "Present";
            attendance.checkInTime = new Date();
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                volunteerId: req.user._id,
                campaignId,
                present: true,
                status: "Present",
                checkInTime: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: "Self check-in successful! Welcome to the event.",
            attendance
        });
    } catch (error) {
        console.error("Self Checkin Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get all attendance records for a specific campaign
// @route   GET /attendance/:campaignId
// @access  Private (Admin only)
router.get("/:campaignId", protect, authorize("Admin"), async (req, res) => {
    try {
        const attendance = await Attendance.find({ campaignId: req.params.campaignId })
            .populate("volunteerId", "name email phone photo");

        res.status(200).json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        console.error("Get Campaign Attendance Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get current volunteer's attendance summary
// @route   GET /attendance/my/summary
// @access  Private (Volunteer only)
router.get("/my/summary", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const attendance = await Attendance.find({ volunteerId: req.user._id })
            .populate("campaignId", "title date location category");

        res.status(200).json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        console.error("Get My Attendance Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
