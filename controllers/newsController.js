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
        
        // 👑 SMART TEXT MERGE JUGAAD:
        // Agar short description aur main content dono alag hain, toh hum dono ko combine kar dete hain 
        // taaki article frontend par bada aur professional dikhe, ek line ka na lage!
        let fullContentText = "";
        if (item.description && item.content) {
          // Agar dono alag hain toh dono jod do
          fullContentText = `${item.description}\n\n${item.content}`;
        } else {
          fullContentText = item.content || item.description || "पूरा समाचार पढ़ने के लिए बने रहें। Bharatvaani News.";
        }

        // Agar content abhi bhi bohot chota hai, toh news source ka link snippet bhi add kar sakte hain optionally
        if (item.link && fullContentText.length < 150) {
          fullContentText += `\n\n(विस्तृत रिपोर्ट के लिए मुख्य स्रोत का अवलोकन करें।)`;
        }

        const newArticle = await Article.create({
          title: articleTitle,                       
          headline: articleTitle,                    
          content: fullContentText, // 👈 Ab yahan dynamic combined text jayega
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
      message: `Sync complete! ${newCount} expanded articles fetched.` 
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