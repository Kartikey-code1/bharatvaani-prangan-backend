import express from "express";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Article from "../models/article.js";
import upload from "../middleware/upload.js";

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

// GET SINGLE ARTICLE
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
      const { title, category, content } = req.body;

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
        category,
        content,
        image: imageUrl,
        video: videoUrl,
      });

      await article.save();

      res.status(201).json({
        success: true,
        article,
      });
    } catch (err) {
      console.error("Publish Error:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

export default router;