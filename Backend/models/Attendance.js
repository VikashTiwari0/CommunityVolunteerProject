import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
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
    present: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Present", "Absent", "Late"],
        default: "Absent"
    },
    checkInTime: {
        type: Date
    }
});

// Ensure compound unique index so attendance is logged once per volunteer per campaign
AttendanceSchema.index({ volunteerId: 1, campaignId: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", AttendanceSchema);
export default Attendance;
