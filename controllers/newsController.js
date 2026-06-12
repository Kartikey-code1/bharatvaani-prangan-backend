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

    // 👑 BROAD ENHANCEMENT: Category filter hataya taaki UP ki koi bhi khabar miss na ho (More results fetch honge)
    const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=uttar%20pradesh&country=in&language=hi&image=1&domainurl=ndtv.in,navbharattimes.indiatimes.com`;

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
        
        let fullContentText = "";
        if (item.description && item.content) {
          fullContentText = `${item.description}\n\n${item.content}`;
        } else {
          fullContentText = item.content || item.description || "पूरा समाचार पढ़ने के लिए बने रहें। Bharatvaani News.";
        }

        // 👑 DYNAMIC CATEGORY ASSIGNMENT:
        // API se aane wali pehli category uthayega, agar nahi milti toh standard "National" rakhega
        let articleCategory = "National";
        if (item.category && item.category.length > 0) {
          // Capitalize first letter (e.g., 'top' -> 'Top', 'politics' -> 'Politics')
          articleCategory = item.category[0].charAt(0).toUpperCase() + item.category[0].slice(1);
        }

        const newArticle = await Article.create({
          title: articleTitle,                       
          headline: articleTitle,                    
          content: fullContentText, 
          category: articleCategory, // 👈 Ab category frontend filters ke sath mismatch nahi karegi
          image: item.image_url || null,
          video: item.video_url || null,
          slug: slug,
          status: 'published'
        });

        newCount++;

        if (newArticle.image && typeof publishEverywhere === 'function') {
          try {
            await publishEverywhere(newArticle); 
          } catch (socErr) {
            console.error("Social media automation delay skipped:", socErr.message);
          }
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Sync complete! ${newCount} fresh broad articles fetched successfully.` 
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