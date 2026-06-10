import express from "express";
import Article from "../models/article.js"; // Standard collection naming casing matching

const router = express.Router();

// GET ALL NEWS FEED BACKUP
router.get("/", async (req, res) => {
  try {
    const count = await Article.countDocuments();
    console.log("TOTAL ARTICLES READ BY NEWSROUTER:", count);

    const news = await Article.find().sort({ createdAt: -1 });
    res.status(200).json(news);
  } catch (error) {
    console.log("GET NEWS ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE ARTICLE VIA SLUG OR ID BACKUP
router.get("/:id", async (req, res) => {
  try {
    const param = req.params.id;
    let article = null;

    if (/^[0-9a-fA-F]{24}$/.test(param)) {
      article = await Article.findById(param);
    } else {
      article = await Article.findOne({ slug: param });
    }

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json(article);
  } catch (error) {
    console.log("GET ARTICLE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;