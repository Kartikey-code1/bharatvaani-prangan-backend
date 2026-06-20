import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// 1. Sabse pehle dotenv load karo
dotenv.config();

import "./config/cloudinary.js";
import articleRoutes from "./routes/articleRoutes.js";
import Article from "./models/article.js"; // 👑 SEO FIX: Article model import kiya taaki sitemap data fetch kar sake

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

// 👑 SEO DYNAMIC SITEMAP GENERATOR ENGINE
// Ye route Google aur baaki search engines ko automatic naye news articles ke links provide karega
app.get("/sitemap.xml", async (req, res) => {
  try {
    // Database se sirf published articles ke slug aur unke update hone ki date nikalenge
    const articles = await Article.find({ status: "published" }).select("slug updatedAt");
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // 1. Website ka Main Homepage Link (Vercel Production Domain)
    xml += `
    <url>
      <loc>https://bharatvaani-news.vercel.app/</loc> 
      <priority>1.0</priority>
      <changefreq>always</changefreq>
    </url>`;
    
    // 2. Saare live news articles ke slugs ko automatic loop chala kar insert karenge
    articles.forEach((art) => {
      xml += `
      <url>
        <loc>https://bharatvaani-news.vercel.app/article/${art.slug}</loc>
        <lastmod>${new Date(art.updatedAt).toISOString().split("T")[0]}</lastmod>
        <priority>0.8</priority>
        <changefreq>daily</changefreq>
      </url>`;
    });
    
    xml += `</urlset>`;
    
    // Browser aur web scrapers ko batayenge ki ye ek structured XML resource data stream hai
    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    console.error("❌ Sitemap Generation Core Engine Crash:", err);
    res.status(500).end();
  }
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