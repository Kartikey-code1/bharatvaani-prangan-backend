import axios from "axios";
import Article from "../models/News.js";
import { rewriteArticle } from "./openrouterservice.js";
import addLogoToImage from "./imageService.js";

const fetchNews = async () => {
  try {
    console.log("📰 Fetching latest news...");

    const response = await axios.get(
      `https://gnews.io/api/v4/top-headlines?country=in&lang=hi&max=10&apikey=${process.env.GNEWS_API_KEY}`
    );

    const articles = response.data.articles;

    for (const item of articles) {
      try {
        const exists = await Article.findOne({
          title: item.title,
        });

        if (exists) {
          console.log("⚠ Already exists:", item.title);
          continue;
        }

        const originalNews = `
Title:
${item.title}

Description:
${item.description}

Content:
${item.content || item.description}
`;

        const rewritten = await rewriteArticle(`
Rewrite this news professionally in Hindi.

Rules:
- Minimum 15 paragraphs
- At least 1200 words
- Expand the story with background, context, impact and analysis
- Professional Hindi news style
- Human-like writing
- Do not mention AI
- Do not mention source names
- Return ONLY article content

News Title:
${item.title}

News Description:
${item.description}

Available Content:
${item.content || item.description}
`);

        const rewrittenTitle = await rewriteArticle(`
Create one professional Hindi news headline from this news.

Rules:
- Short headline
- Attractive
- Hindi only
- No quotes
- No extra text

News:
${originalNews}
`);

        const safeTitle =
  rewrittenTitle?.trim() &&
  rewrittenTitle !== "News unavailable"
    ? rewrittenTitle.trim()
    : item.title;

        // slug
        const slug = safeTitle
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\u0900-\u097F ]/g, "")
          .replace(/\s+/g, "-");

        // logo wali image generate
        const finalImage = await addLogoToImage(
          item.image,
          slug
        );
const saved = await Article.create({
  title: safeTitle,
  slug,
  description: rewritten.substring(0, 500),
  content: rewritten,
  image: finalImage,
  category: "India",
  source: "Bharatvaani Prangan",
  publishedAt: new Date()
});

console.log("SAVED ID:", saved._id);

        console.log("✅ Saved:", safeTitle);
      } catch (err) {
        console.log("❌ Article Error:", err.message);
      }
    }
  } catch (error) {
    console.log("❌ Fetch Error:", error.message);
  }
};

export default fetchNews;