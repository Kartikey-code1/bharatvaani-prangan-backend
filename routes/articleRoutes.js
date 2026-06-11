import express from "express";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Article from "../models/article.js";
import upload from "../middleware/upload.js";

// controllers/newsController.js se syncExternalNews function pull ho raha hai
import { syncExternalNews } from "../controllers/newsController.js";
import { publishEverywhere } from "../services/newsService.js";

const router = express.Router();

const uploadToCloudinary = (buffer, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "bharatvaani",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// GET ALL ARTICLES
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔥 1. AUTOMATIC SYNC ROUTE (Hamesha isko :id waale ke UPAR hona chahiye)
// Endpoint: GET https://bharatvaani-prangan-backend-1.onrender.com/api/articles/sync-channels
router.get("/sync-channels", syncExternalNews);

// 🔥 2. GET SINGLE ARTICLE (Yeh ab niche hai, toh ab dynamic conflict nahi hoga)
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json(article);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// MANUAL ARTICLE PUBLISH
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, category, content, publishEverywhere: flag } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: "Title and Content required",
        });
      }

      let imageUrl = "";
      let videoUrl = "";

      // Upload Image
      if (req.files?.image?.[0]) {
        const img = await uploadToCloudinary(
          req.files.image[0].buffer,
          "image"
        );
        imageUrl = img.secure_url;
      }

      // Upload Video
      if (req.files?.video?.[0]) {
        const vid = await uploadToCloudinary(
          req.files.video[0].buffer,
          "video"
        );
        videoUrl = vid.secure_url;
      }

      const article = new Article({
        title,
        category: category || "National",
        content,
        image: imageUrl || null,
        video: videoUrl || null,
        status: "published"
      });

      if (!article.slug) {
        article.slug = title.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-") + "-" + Date.now();
      }

      await article.save();

      // SOCIAL MEDIA SHARING PIPELINE TRIGGER
      if (flag === "true" || flag === true) {
        try {
          await publishEverywhere(article);
          console.log(`✅ Dashboard content shared to Social Handles: ${title}`);
        } catch (socialError) {
          console.error("Social Media trigger encountered a minor lag:", socialError.message);
        }
      }

      res.status(201).json({ success: true, data: article });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// DELETE ARTICLE ENDPOINT FOR THE MANAGE PAGE
router.delete("/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;