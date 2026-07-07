import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Certificate from "../models/Certificate.js";
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { generateCertificatePDF } from "../utils/pdfGenerator.js";
import { sendNotificationEmail } from "../utils/emailService.js";

const router = express.Router();

// Define dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Generate Certificate (Admin only)
// @route   POST /certificates/generate
// @access  Private (Admin only)
router.post("/generate", protect, authorize("Admin"), async (req, res) => {
    try {
        const { volunteerId, campaignId, hours } = req.body;

        if (!volunteerId || !campaignId || !hours) {
            return res.status(400).json({ success: false, message: "Please provide volunteerId, campaignId, and hours" });
        }

        const volunteer = await User.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        // Generate Certificate PDF Bytes
        const dateString = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        const pdfBytes = await generateCertificatePDF(volunteer.name, campaign.title, hours, dateString);

        // Ensure directories exist
        const certificatesDir = path.join(__dirname, "..", "public", "certificates");
        if (!fs.existsSync(certificatesDir)) {
            fs.mkdirSync(certificatesDir, { recursive: true });
        }

        // Save PDF locally to serve statically
        const fileName = `cert_${volunteerId}_${campaignId}.pdf`;
        const filePath = path.join(certificatesDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(pdfBytes));

        // Create PDF URL
        const pdfUrl = `/certificates/${fileName}`;

        // Upsert Certificate Record
        let certificate = await Certificate.findOne({ volunteerId, campaignId });
        if (certificate) {
            certificate.pdfUrl = pdfUrl;
            certificate.hours = hours;
            certificate.issuedDate = new Date();
            await certificate.save();
        } else {
            certificate = await Certificate.create({
                volunteerId,
                campaignId,
                pdfUrl,
                hours,
                issuedDate: new Date()
            });
        }

        // Notify Volunteer via Email
        await sendNotificationEmail(
            volunteer.email,
            "Certificate of Appreciation Issued! 🏆",
            "Congratulations on Your Service!",
            `Dear ${volunteer.name},<br><br>We are pleased to issue your Certificate of Appreciation for completing <b>${hours} hours</b> of service in the campaign: <b>"${campaign.title}"</b>.<br><br>You can view and download your certificate directly from your Volunteer Dashboard, or by clicking the link below:<br><a href="http://localhost:5000${pdfUrl}" target="_blank">Download Certificate PDF</a>`
        );

        // Notify Volunteer via Real-Time Socket
        const io = req.app.get("socketio");
        if (io) {
            io.emit(`notification_${volunteerId}`, {
                type: "CERTIFICATE_ISSUED",
                title: "Certificate Issued! 🏆",
                message: `You earned a certificate for: "${campaign.title}" (${hours} hours).`,
                pdfUrl: `http://localhost:5000${pdfUrl}`
            });
        }

        res.status(201).json({
            success: true,
            message: "Certificate generated and volunteer notified successfully",
            certificate
        });
    } catch (error) {
        console.error("Generate Certificate Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get current volunteer's certificates
// @route   GET /certificates/me
// @access  Private (Volunteer only)
router.get("/me", protect, authorize("Volunteer"), async (req, res) => {
    try {
        const certificates = await Certificate.find({ volunteerId: req.user._id })
            .populate("campaignId", "title date location");

        res.status(200).json({ success: true, count: certificates.length, certificates });
    } catch (error) {
        console.error("Get My Certificates Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get all certificates (Admin only)
// @route   GET /certificates/all
// @access  Private (Admin only)
router.get("/all", protect, authorize("Admin"), async (req, res) => {
    try {
        const certificates = await Certificate.find()
            .populate("volunteerId", "name email")
            .populate("campaignId", "title date");

        res.status(200).json({ success: true, count: certificates.length, certificates });
    } catch (error) {
        console.error("Get All Certificates Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
