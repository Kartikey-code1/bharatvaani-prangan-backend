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

    // 👑 RE-MAPPED QUERY BUILDER ENGINE (Exact matching from screenshot)
    // - Endpoint changed to /latest
    // - q is 'uttar pradesh', domains are locked to ndtv.in and navbharattimes.indiatimes.com
    // - Filtered parameters for images added securely
    const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=uttar%20pradesh&country=in&language=hi&category=breaking,business,crime,education,politics&image=1&domainurl=ndtv.in,navbharattimes.indiatimes.com`;

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
      message: `Sync complete! ${newCount} nayi UP focused khabrein NDTV/Navbharat se successfully fetch ho gayi hain.` 
    });

  } catch (error) {
    console.error("Newsdata sync error detailed analysis:", error);
    res.status(500).json({ 
      success: false, 
      message: "Automatic channel sync failed", 
      details: error.response?.data?.results?.message || error.message 
    });
  }
}