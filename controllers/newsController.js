import axios from 'axios';
import slugify from 'slugify';
import News from '../models/News.js';
import { publishEverywhere } from '../services/newsService.js';

// ---- Purane functions (getNews, createNews, etc.) ko waise hi rehne dena ----

// 🔥 NAYA AUTOMATIC SETUP FOR ABP & NDTV
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
      // Check karo ki kya yeh khabar pehle se database mein hai
      const exists = await News.findOne({ title: item.title });
      
      if (!exists) {
        const slug = slugify(item.title || 'news', { lower: true, strict: true }) + '-' + Date.now();
        
        // Database mein save ho raha hai
        const newArticle = await News.create({
          title: item.title,
          content: item.description || "पूरा समाचार पढ़ने के लिए बने रहें।",
          category: "National", 
          image: item.image_url || null,
          video: item.video_url || null,
          slug: slug,
          status: 'published'
        });

        newCount++;

        // 🔥 SOCIAL MEDIA AUTO-POST: Agar is auto-fetched article ko social media par bhejna hai
        if (newArticle.image) {
          try {
            await publishEverywhere(newArticle); 
            console.log(`✅ Social Media Shared: ${item.title}`);
          } catch (socErr) {
            console.error("Social media auto-share failed for this post:", socErr);
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
    res.status(500).json({ success: false, message: "Automatic channel sync failed" });
  }
}