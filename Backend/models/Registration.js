import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending"
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure a volunteer can only register for a campaign once
RegistrationSchema.index({ volunteerId: 1, campaignId: 1 }, { unique: true });

const Registration = mongoose.model("Registration", RegistrationSchema);
export default Registration;
