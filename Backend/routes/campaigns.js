import express from "express";
import Campaign from "../models/Campaign.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

// @desc    Create a new campaign
// @route   POST /campaigns
// @access  Private (Admin only)
router.post("/", protect, authorize("Admin"), upload.single("image"), async (req, res) => {
    try {
        const { title, description, date, time, location, maxVolunteers, category, skillsRequired } = req.body;

        let image = "";
        let imagePublicId = "";
        
        // Handle file upload via Multer & Cloudinary
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.path);
            if (uploadResult) {
                image = uploadResult.secure_url;
                imagePublicId = uploadResult.public_id;
            }
        } else if (req.body.image) {
            image = req.body.image;
        }

        let skillsArr = [];
        if (skillsRequired) {
            if (typeof skillsRequired === "string") {
                try {
                    skillsArr = JSON.parse(skillsRequired);
                } catch (e) {
                    skillsArr = skillsRequired.split(",").map(s => s.trim()).filter(Boolean);
                }
            } else if (Array.isArray(skillsRequired)) {
                skillsArr = skillsRequired;
            }
        }

        const campaign = await Campaign.create({
            title,
            description,
            date,
            time,
            location,
            maxVolunteers,
            category,
            skillsRequired: skillsArr,
            image,
            imagePublicId,
            createdBy: req.user._id
        });

        // Broadcast real-time announcement if socket.io is initialized
        const io = req.app.get("socketio");
        if (io) {
            io.emit("announcement", {
                type: "CAMPAIGN_CREATED",
                title: "New Campaign Created! 🌱",
                message: `Join our new campaign: "${title}" on ${new Date(date).toLocaleDateString()} at ${location}!`,
                campaignId: campaign._id
            });
        }

        res.status(201).json({ success: true, campaign });
    } catch (error) {
        console.error("Create Campaign Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get all campaigns
// @route   GET /campaigns
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const campaigns = await Campaign.find().populate("createdBy", "name email").lean();
        
        // Count actual accepted registrations for each campaign
        const updatedCampaigns = await Promise.all(campaigns.map(async (camp) => {
            const acceptedCount = await Registration.countDocuments({
                campaignId: camp._id,
                status: "Accepted"
            });
            return {
                ...camp,
                acceptedCount
            };
        }));

        res.status(200).json({ success: true, count: campaigns.length, campaigns: updatedCampaigns });
    } catch (error) {
        console.error("Get Campaigns Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get single campaign by ID
// @route   GET /campaigns/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id).populate("createdBy", "name email");

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        res.status(200).json({ success: true, campaign });
    } catch (error) {
        console.error("Get Campaign Detail Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Update campaign details
// @route   PATCH /campaigns/:id
// @access  Private (Admin only)
router.patch("/:id", protect, authorize("Admin"), upload.single("image"), async (req, res) => {
    try {
        let campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        // Handle cover image file upload
        if (req.file) {
            // Delete old cover image from Cloudinary if it exists
            if (campaign.imagePublicId) {
                await deleteFromCloudinary(campaign.imagePublicId);
            }
            const uploadResult = await uploadToCloudinary(req.file.path);
            if (uploadResult) {
                campaign.image = uploadResult.secure_url;
                campaign.imagePublicId = uploadResult.public_id;
            }
        } else if (req.body.image === "") {
            // Admin requested to clear cover image
            if (campaign.imagePublicId) {
                await deleteFromCloudinary(campaign.imagePublicId);
            }
            campaign.image = "";
            campaign.imagePublicId = "";
        } else if (req.body.image !== undefined && req.body.image !== "") {
            // Manually provided cover image URL
            if (campaign.imagePublicId) {
                await deleteFromCloudinary(campaign.imagePublicId);
            }
            campaign.image = req.body.image;
            campaign.imagePublicId = "";
        }

        const fieldsToUpdate = [
            "title",
            "description",
            "date",
            "time",
            "location",
            "maxVolunteers",
            "category",
            "status"
        ];

        fieldsToUpdate.forEach((field) => {
            if (req.body[field] !== undefined) {
                campaign[field] = req.body[field];
            }
        });

        // Parse skillsRequired if supplied
        if (req.body.skillsRequired !== undefined) {
            let skillsArr = [];
            const skillsVal = req.body.skillsRequired;
            if (typeof skillsVal === "string") {
                try {
                    skillsArr = JSON.parse(skillsVal);
                } catch (e) {
                    skillsArr = skillsVal.split(",").map(s => s.trim()).filter(Boolean);
                }
            } else if (Array.isArray(skillsVal)) {
                skillsArr = skillsVal;
            }
            campaign.skillsRequired = skillsArr;
        }

        await campaign.save();

        res.status(200).json({ success: true, campaign });
    } catch (error) {
        console.error("Update Campaign Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Delete campaign
// @route   DELETE /campaigns/:id
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        // Delete cover image from Cloudinary if it exists
        if (campaign.imagePublicId) {
            await deleteFromCloudinary(campaign.imagePublicId);
        }

        // Delete associated registrations and attendance records
        await Registration.deleteMany({ campaignId: campaign._id });
        await campaign.deleteOne();

        res.status(200).json({ success: true, message: "Campaign, cover image, and registrations deleted successfully" });
    } catch (error) {
        console.error("Delete Campaign Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Register for a campaign
// @route   POST /campaigns/:id/register
// @access  Private (Volunteer only)
router.post("/:id/register", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        if (campaign.status === "Completed" || campaign.status === "Cancelled") {
            return res.status(400).json({ success: false, message: "Cannot register for a completed or cancelled campaign" });
        }

        // Check if already registered
        const existingReg = await Registration.findOne({
            volunteerId: req.user._id,
            campaignId: campaign._id
        });

        if (existingReg) {
            return res.status(400).json({ success: false, message: "You have already registered for this campaign" });
        }

        // Verify campaign is not full
        const registrationCount = await Registration.countDocuments({
            campaignId: campaign._id,
            status: "Accepted"
        });

        if (registrationCount >= campaign.maxVolunteers) {
            return res.status(400).json({ success: false, message: "This campaign is already full" });
        }

        // Create registration
        const registration = await Registration.create({
            volunteerId: req.user._id,
            campaignId: campaign._id,
            status: "Pending" // Default is Pending until Admin reviews
        });

        res.status(201).json({
            success: true,
            message: "Successfully requested to join campaign. Status: Pending Admin approval.",
            registration
        });
    } catch (error) {
        console.error("Campaign Registration Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Cancel registration for a campaign
// @route   DELETE /campaigns/:id/register
// @access  Private (Volunteer only)
router.delete("/:id/register", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const registration = await Registration.findOne({
            volunteerId: req.user._id,
            campaignId: req.params.id
        });

        if (!registration) {
            return res.status(404).json({ success: false, message: "Registration not found" });
        }

        await registration.deleteOne();
        res.status(200).json({ success: true, message: "Campaign registration cancelled successfully" });
    } catch (error) {
        console.error("Cancel Registration Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get all volunteers registered for a campaign
// @route   GET /campaigns/:id/volunteers
// @access  Private (Admin only)
router.get("/:id/volunteers", protect, authorize("Admin"), async (req, res) => {
    try {
        const registrations = await Registration.find({ campaignId: req.params.id })
            .populate("volunteerId", "name email phone photo skills interests availability location");

        res.status(200).json({ success: true, count: registrations.length, registrations });
    } catch (error) {
        console.error("Get Campaign Registrants Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Approve/Reject a volunteer registration
// @route   PATCH /campaigns/:id/volunteers/:volunteerId
// @access  Private (Admin only)
router.patch("/:id/volunteers/:volunteerId", protect, authorize("Admin"), async (req, res) => {
    try {
        const { status } = req.body; // 'Accepted' or 'Rejected'

        if (!["Accepted", "Rejected", "Pending"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const registration = await Registration.findOne({
            campaignId: req.params.id,
            volunteerId: req.params.volunteerId
        });

        if (!registration) {
            return res.status(404).json({ success: false, message: "Registration record not found" });
        }

        registration.status = status;
        registration.assignedBy = req.user._id;
        await registration.save();

        // Broadcast socket notification to the specific volunteer if connected
        const io = req.app.get("socketio");
        if (io) {
            io.emit(`notification_${req.params.volunteerId}`, {
                type: "REGISTRATION_UPDATE",
                title: `Campaign Status Updated! 📢`,
                message: `Your registration status has been updated to "${status}" for campaign ID: ${req.params.id}.`,
                campaignId: req.params.id,
                status
            });
        }

        res.status(200).json({
            success: true,
            message: `Registration successfully updated to ${status}`,
            registration
        });
    } catch (error) {
        console.error("Approve Registration Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get user's joined campaigns (active/completed)
// @route   GET /campaigns/my/registrations
// @access  Private (Volunteer only)
router.get("/my/registrations", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const registrations = await Registration.find({ volunteerId: req.user._id })
            .populate("campaignId");

        res.status(200).json({ success: true, count: registrations.length, registrations });
    } catch (error) {
        console.error("Get Joined Campaigns Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
