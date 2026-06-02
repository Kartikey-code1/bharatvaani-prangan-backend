import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import "./config/cloudinary.js";
import articleRoutes from "./routes/articleRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/articles", articleRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
};
connectDB();

// Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const expectedEmail = process.env.ADMIN_EMAIL || "bharatvaaniprangan@gmail.com";
  const expectedPassword = process.env.ADMIN_PASSWORD || "123456";

  if (email === expectedEmail && password === expectedPassword) {
    return res.json({
      success: true,
      token: "secure_dummy_token_xyz123",
      message: "Login successful!",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Galat Email ya Password!",
  });
});

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bharatvaani Backend Running 🚀",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});