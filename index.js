const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const formData = require("form-data");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Scan = require("./models/Scan");
const User = require("./models/User"); // Added User model import

const app = express();
const PORT = process.env.PORT || 5001; // Changed default PORT
const JWT_SECRET =
    process.env.JWT_SECRET || "your-super-secret-key-change-this"; // Added JWT_SECRET constant
const MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/skin-cancer-db"; // Added MONGO_URI constant

// MongoDB Connection
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB Successfully"))
    .catch((err) => console.error("CRITICAL: MongoDB Connection Error:", err));

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Auth Middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) throw new Error();

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            console.error("AUTH ERROR: User not found in DB for ID:", decoded.id);
            throw new Error();
        }

        req.user = user;
        next();
    } catch (e) {
        console.error("AUTH ERROR:", e.message);
        res.status(401).json({ error: "Please authenticate." });
    }
};

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ error: "Email already exists" });

        const user = new User({ email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ user: { id: user._id, email: user.email }, token });
    } catch (e) {
        res.status(500).json({ error: "Error creating user" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ user: { id: user._id, email: user.email }, token });
    } catch (e) {
        res.status(500).json({ error: "Login error" });
    }
});

// API Endpoints
app.post("/api/upload", auth, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const imagePath = req.file.path;
        console.log("--- START ANALYSIS ---");
        console.log("User ID:", req.user._id);
        console.log("File uploaded to:", imagePath);

        // Forward to AI Service
        const form = new formData();
        form.append("file", fs.createReadStream(imagePath));

        const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
        console.log("Forwarding to AI Service:", `${aiServiceUrl}/predict`);

        const aiResponse = await axios.post(`${aiServiceUrl}/predict`, form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        console.log("AI Service Responded:", aiResponse.status);
        const scanData = aiResponse.data;

        if (scanData.is_related === false) {
            console.log("REJECTED: Image not related to skin lesions.");
            return res.status(422).json({
                success: false,
                error: "Unrelated Image",
                details: scanData.error || "This image is not related to skin lesion analysis.",
                detected_object: scanData.detected_object
            });
        }

        // Save to MongoDB
        const newScan = new Scan({
            userId: req.user._id,
            imageUrl: `/uploads/${req.file.filename}`,
            prediction: {
                class: scanData.class,
                confidence: scanData.confidence,
                is_cancerous: scanData.is_cancerous,
            },
            metadata: {
                raw_label: scanData.raw_label,
            },
        });

        await newScan.save();
        console.log("Scan saved to DB:", newScan._id);

        res.json({
            success: true,
            scan: newScan,
        });
    } catch (error) {
        console.error("ERROR PROCESSING SCAN:", error.message);
        if (error.response) {
            console.error("AI SERVICE ERROR DATA:", error.response.data);
        }
        res
            .status(500)
            .json({
                error: "Internal Server Error during scan processing",
                details: error.message,
            });
    }
});

app.get("/api/history", auth, async (req, res) => {
    try {
        const history = await Scan.find({ userId: req.user._id }).sort({
            createdAt: -1,
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Error fetching history" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Force nodemon restart
