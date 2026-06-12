import axios from 'axios';
import slugify from 'slugify';
import Article from '../models/article.js'; 
import { publishEverywhere } from '../services/newsService.js';

export async function syncExternalNews(req, res) {
  try {
    const API_KEY = process.env.NEWSDATA_API_KEY; 
    
    if (!API_KEY) {
      return res.status(500).json({ success: false, message: "NEWSDATA_API_KEY missing in .env file" });
    }

    // 👑 FIX: Passed full accurate domains to fix Newsdata.io 422 validation crash
    const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=in&language=hi&domain=bhaskar.com,ndtv.in`;

    const apiResponse = await axios.get(url);
    const articles = apiResponse.data.results || [];

    let newCount = 0;

    for (let item of articles) {
      const exists = await Article.findOne({
        $or: [
          { title: item.title },
          { headline: item.title }
        ]
      });
      
      if (!exists) {
        const articleTitle = item.title || "मुख्य समाचार";
        const slug = slugify(articleTitle, { lower: true, strict: true }) + '-' + Date.now();
        
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

    res.status(200).json({ 
      success: true, 
      message: `Sync complete! ${newCount} nayi khabrein Dainik Bhaskar/NDTV se aayi hain.` 
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