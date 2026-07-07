import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Campaign from "./models/Campaign.js";
import { generateCertificatePDF } from "./utils/pdfGenerator.js";

dotenv.config();

const runTests = async () => {
    console.log("=== STARTING BACKEND UNIT TESTS ===");
    
    // 1. Test Database Connectivity
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/unityhub_volunteer_test");
        console.log("✅ Database connected successfully.");
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }

    // Clear test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Campaign.deleteMany({ title: /Test Campaign/ });

    // 2. Test User Model, Pre-Save Hash Hook & Compare Password
    try {
        const testPass = "supersecret123";
        const user = await User.create({
            name: "Test Volunteer",
            email: "testvolunteer@example.com",
            password: testPass,
            role: "Volunteer",
            skills: ["First Aid", "Driving"],
            interests: ["Healthcare"]
        });

        console.log("✅ User created successfully in Mongoose.");
        console.log("   Hashed Password in DB:", user.password !== testPass ? "YES (Success)" : "NO (Failed)");

        const isMatch = await user.comparePassword(testPass);
        console.log("✅ Password comparison matching:", isMatch ? "YES (Success)" : "NO (Failed)");

        const wrongMatch = await user.comparePassword("wrongpass");
        console.log("✅ Password comparison mismatch check:", !wrongMatch ? "PASS" : "FAIL");

        // 3. Test JWT Token generation
        const token = user.generateJWT();
        console.log("✅ JWT generation succeeded. Token:", token.substring(0, 30) + "...");
    } catch (err) {
        console.error("❌ User Model testing failed:", err);
    }

    // 4. Test PDF Certificate Generation
    try {
        const pdfBytes = await generateCertificatePDF(
            "Test Volunteer",
            "Test Campaign: Blood Drive",
            6,
            new Date().toLocaleDateString()
        );
        console.log("✅ pdf-lib PDF certificate generation verified. Bytes count:", pdfBytes.length);
    } catch (err) {
        console.error("❌ PDF generation testing failed:", err);
    }

    // Close Database
    await mongoose.connection.close();
    console.log("=== BACKEND UNIT TESTS FINISHED ===");
};

runTests();
