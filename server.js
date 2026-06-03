import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// 1. Sabse pehle dotenv load karo
dotenv.config();

import "./config/cloudinary.js";
import articleRoutes from "./routes/articleRoutes.js";

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(express.json());

app.use("/api/articles", articleRoutes);

// 2. Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, token: "secure_token_xyz123", message: "Login successful!" });
  }
  return res.status(401).json({ success: false, message: "Galat Email ya Password!" });
});

app.get("/", (req, res) => res.json({ success: true, message: "Backend Running 🚀" }));

// 3. Database Connection ko yahan handle karo
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in Environment Variables!");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Error hone par process band ho jaye taaki Render restart kare
  }
};

startServer();