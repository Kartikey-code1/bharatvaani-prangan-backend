import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

// Important: Cloudinary aur Routes imports
import "./config/cloudinary.js";
import articleRoutes from "./routes/articleRoutes.js";

const app = express();

// Middlewares - CORS fully open for production
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/articles", articleRoutes);

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ ERROR: MONGO_URI is not defined in .env!");
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  }
};
connectDB();

// Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  
  // Ab ye sirf tumhare environment variables se password uthaega
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (email === expectedEmail && password === expectedPassword) {
    return res.json({ 
      success: true, 
      token: "secure_token_xyz123", 
      message: "Login successful!" 
    });
  }

  return res.status(401).json({ 
    success: false, 
    message: "Galat Email ya Password!" 
  });
});

// Health Check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Bharatvaani Backend Running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});