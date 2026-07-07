import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Load routes
import authRoutes from "./routes/auth.js";
import volunteerRoutes from "./routes/volunteers.js";
import campaignRoutes from "./routes/campaigns.js";
import attendanceRoutes from "./routes/attendance.js";
import certificateRoutes from "./routes/certificates.js";
import aiRoutes from "./routes/ai.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
// const io = new Server(server, {
//     cors: {
//         origin: "*", // Allow all origins for testing
//         methods: ["GET", "POST", "PATCH", "DELETE"]
//     }
// });

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true,
    },
});
// Store socketio in app instance for route access
app.set("socketio", io);

// Define static path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Body parser, Cookie parser & CORS
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [process.env.CLIENT_URL, "http://127.0.0.1:5173"],
    credentials: true
}));

// Mount API routes
app.use("/auth", authRoutes);
app.use("/volunteers", volunteerRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/certificates", certificateRoutes);
app.use("/ai", aiRoutes);

// Base route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to UnityHub Volunteer Portal API"
    });
});

// Socket.io Connection Logic
io.on("connection", (socket) => {
    console.log(`New WebSocket Connection: ${socket.id}`);

    // Join user-specific notification room
    socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log(`WebSocket Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});