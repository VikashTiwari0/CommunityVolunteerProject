import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema({
    volunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
        required: true
    },
    pdfUrl: {
        type: String,
        required: true
    },
    hours: {
        type: Number,
        required: true,
        default: 0
    },
    issuedDate: {
        type: Date,
        default: Date.now
    }
});

// Ensure a volunteer gets only one certificate per campaign
CertificateSchema.index({ volunteerId: 1, campaignId: 1 }, { unique: true });

const Certificate = mongoose.model("Certificate", CertificateSchema);
export default Certificate;
