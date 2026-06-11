// backend/services/newsService.js
import axios from 'axios';

export const publishEverywhere = async (article) => {
  try {
    if (!article || !article.title) return false;

    console.log(`🚀 Real Social Media Pipeline Triggered for: "${article.title}"`);
    
    // 🔴 1. FACEBOOK PAGE AUTO-POST
    const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    if (FB_ACCESS_TOKEN && FB_PAGE_ID && article.image) {
      // Meta Graph API ke zariye image aur caption page par push karna
      await axios.post(`https://graph.facebook.com/${FB_PAGE_ID}/photos`, {
        url: article.image,
        caption: `🚨 ${article.title}\n\nपूरा समाचार पढ़ें: https://bharatvaaniprangan.com/article/${article._id || article.slug}`,
        access_token: FB_ACCESS_TOKEN
      });
      console.log("✅ Facebook Page par photo post ho gayi!");
    }

    // 🔴 2. TWITTER / X AUTO-POST
    // (Iske liye twitter-api-v2 library ya oauth requests lagte hain)

    return true;
  } catch (error) {
    // Agar koi social API fail ho toh console mein error dikhega, par tumhara main website server nahi rukega
    console.error("🔴 Social media posting mein dikhkat aayi:", error.response?.data || error.message);
    return false;
  }
};