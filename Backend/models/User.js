import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"]
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please add a valid email"
        ]
    },
    password: {
        type: String,
        select: false // Exclude from queries by default
    },
    role: {
        type: String,
        enum: ["Admin", "Volunteer"],
        default: "Volunteer"
    },
    photo: {
        type: String,
        default: ""
    },
    photoPublicId: {
        type: String,
        default: ""
    },

    phone: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    interests: {
        type: [String],
        default: []
    },
    availability: {
        type: String,
        default: "Weekends" // e.g. Weekends, Weekdays, Full-time
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    firebaseUid: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt and set default avatar if empty
UserSchema.pre("save", async function() {
    // Ensure generic unfaced profile silhouette is set if no photo is provided
    if (!this.photo || this.photo.trim() === "") {
        this.photo = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    if (!this.isModified("password")) {
        return;
    }
    // Only encrypt if password exists (e.g. not for pure Google OAuth users)
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token method
UserSchema.methods.generateJWT = function() {
    return jwt.sign(
        { id: this._id, role: this.role, email: this.email },
        process.env.JWT_SECRET || "supersecretjwtkeyforunityhubvolunteerportal2026",
        { expiresIn: "30d" }
    );
};

const User = mongoose.model("User", UserSchema);
export default User;
