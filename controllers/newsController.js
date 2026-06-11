import axios from 'axios';
import slugify from 'slugify';
// 👑 FIX 1: Model import ko News se badal kar Article kar diya jo tumhara asli schema hai
import Article from '../models/article.js'; 
import { publishEverywhere } from '../services/newsService.js';

// ---- Purane functions (getNews, createNews, etc.) ko waise hi rehne dena ----

// 🔥 NAYA AUTOMATIC SETUP FOR ABP & NDTV (FIXED VERSION)
export async function syncExternalNews(req, res) {
  try {
    const API_KEY = process.env.NEWSDATA_API_KEY; 
    
    if (!API_KEY) {
      return res.status(500).json({ success: false, message: "NEWSDATA_API_KEY missing in .env file" });
    }

    // Domain filters lock: abplive,ndtv aur language Hindi (hi)
    const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=in&language=hi&domain=abplive,ndtv`;

    const apiResponse = await axios.get(url);
    const articles = apiResponse.data.results || [];

    let newCount = 0;

    for (let item of articles) {
      // 👑 FIX 2: Check karne ke liye 'title' ki jagah 'headline' use hoga database query mein
      const exists = await Article.findOne({ headline: item.title });
      
      if (!exists) {
        const slug = slugify(item.title || 'news', { lower: true, strict: true }) + '-' + Date.now();
        
        // 👑 FIX 3: Item title ko 'headline' mein save kiya taaki Validation failed ka error permanently khatam ho jaye!
        const newArticle = await Article.create({
          headline: item.title,                      // 👈 Mandatory Field Mapped!
          content: item.description || "पूरा समाचार पढ़ने के लिए बने रहें।",
          category: "National", 
          image: item.image_url || null,
          video: item.video_url || null,
          slug: slug,
          status: 'published'
        });

        newCount++;

        // 🔥 SOCIAL MEDIA AUTO-POST: Agar is auto-fetched article ko social media par bhejna hai
        if (newArticle.image && typeof publishEverywhere === 'function') {
          try {
            await publishEverywhere(newArticle); 
            console.log(`✅ Social Media Shared: ${item.title}`);
          } catch (socErr) {
            console.error("Social media auto-share failed for this post:", socErr.message);
          }
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Sync complete! ${newCount} nayi khabrein ABP/NDTV se aayi hain aur social media par ja chuki hain.` 
    });

  } catch (error) {
    console.error("Newsdata sync error:", error);
    res.status(500).json({ success: false, message: "Automatic channel sync failed", details: error.message });
  }
}