import express from "express";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Article from "../models/article.js";
import upload from "../middleware/upload.js";

import { syncExternalNews } from "../controllers/newsController.js";

// 🔴 SAFE GUARD: Is poore try-catch wrapper se import fail hone par server nahi phatega
let publishEverywhere = null;
try {
  const service = await import("../services/newsService.js");
  publishEverywhere = service.publishEverywhere;
} catch (e) {
  console.log("⚠️ Watchout: newsService.js file server par nahi mili, social auto-post skipped.");
}

const router = express.Router();

const uploadToCloudinary = (buffer, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: "bharatvaani" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// AUTOMATIC SYNC ROUTE
router.get("/sync-channels", syncExternalNews);

// GET ALL ARTICLES
router.get("/", async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET SINGLE ARTICLE
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
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
        return res.status(400).json({ success: false, message: "Title and Content required" });
      }

      let imageUrl = "";
      let videoUrl = "";

      if (req.files?.image?.[0]) {
        const img = await uploadToCloudinary(req.files.image[0].buffer, "image");
        imageUrl = img.secure_url;
      }

      if (req.files?.video?.[0]) {
        const vid = await uploadToCloudinary(req.files.video[0].buffer, "video");
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

      // 🔥 Trigger only if service exists perfectly
      if ((flag === "true" || flag === true) && publishEverywhere) {
        try {
          await publishEverywhere(article);
        } catch (socialError) {
          console.error("Social Media Trigger Lag:", socialError.message);
        }
      }

      res.status(201).json({ success: true, data: article });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// DELETE ARTICLE
router.delete("/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: "Article not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;