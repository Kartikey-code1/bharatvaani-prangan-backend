import axios from 'axios';
import slugify from 'slugify';
import Article from '../models/article.js'; 
import { publishEverywhere } from '../services/newsService.js';

// 🔥 AUTOMATIC CHANNEL SYNC FOR DAINIK BHASKAR & NDTV (UPDATED REGION QUERY)
export async function syncExternalNews(req, res) {
  try {
    const API_KEY = process.env.NEWSDATA_API_KEY; 
    
    if (!API_KEY) {
      return res.status(500).json({ success: false, message: "NEWSDATA_API_KEY missing in .env file" });
    }

    // 👑 FIX: Domain filters changed from 'abplive,ndtv' to 'bhaskar,ndtv'
    const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=in&language=hi&domain=bhaskar,ndtv`;

    const apiResponse = await axios.get(url);
    const articles = apiResponse.data.results || [];

    let newCount = 0;

    for (let item of articles) {
      // Dono conditions check kar rahe hain taaki koi duplicate na ho
      const exists = await Article.findOne({
        $or: [
          { title: item.title },
          { headline: item.title }
        ]
      });
      
      if (!exists) {
        // Title validation safeguard strings clean up
        const articleTitle = item.title || "मुख्य समाचार";
        const slug = slugify(articleTitle, { lower: true, strict: true }) + '-' + Date.now();
        
        // SAFE MAP ENGINE: Dono fields fill ho rahi hain schema requirements ke liye
        const newArticle = await Article.create({
          title: articleTitle,                       
          headline: articleTitle,                    
          content: item.description || item.content || "पूरा समाचार पढ़ने के लिए बने रहें।",
          category: "National", 
          image: item.image_url || null,
          video: item.video_url || null,
          slug: slug,
          status: 'published'
        });

        newCount++;

        // Social handles trigger
        if (newArticle.image && typeof publishEverywhere === 'function') {
          try {
            await publishEverywhere(newArticle); 
            console.log(`✅ Social Media Queue Triggered: ${articleTitle}`);
          } catch (socErr) {
            console.error("Social media automation delay skipped:", socErr.message);
          }
        }
      }
    }

    // Response message updated to reflect Bhaskar & NDTV
    res.status(200).json({ 
      success: true, 
      message: `Sync complete! ${newCount} nayi khabrein Bhaskar/NDTV se aayi hain.` 
    });

  } catch (error) {
    console.error("Newsdata sync error detailed analysis:", error);
    res.status(500).json({ 
      success: false, 
      message: "Automatic channel sync failed", 
      details: error.message 
    });
  }
}