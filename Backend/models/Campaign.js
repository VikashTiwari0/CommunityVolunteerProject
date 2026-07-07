import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please add a campaign title"]
    },
    description: {
        type: String,
        required: [true, "Please add a campaign description"]
    },
    date: {
        type: Date,
        required: [true, "Please add a campaign date"]
    },
    time: {
        type: String,
        required: [true, "Please add a campaign time"]
    },
    location: {
        type: String,
        required: [true, "Please add a campaign location"]
    },
    maxVolunteers: {
        type: Number,
        required: [true, "Please specify maximum volunteers"]
    },
    category: {
        type: String,
        required: [true, "Please specify a category"],
        enum: ["Healthcare", "Environmental", "Education", "Food Security", "Social Services"]
    },
    skillsRequired: {
        type: [String],
        default: []
    },
    image: {
        type: String,
        default: ""
    },
    imagePublicId: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["Upcoming", "Active", "Completed", "Cancelled"],
        default: "Upcoming"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Campaign = mongoose.model("Campaign", CampaignSchema);
export default Campaign;
