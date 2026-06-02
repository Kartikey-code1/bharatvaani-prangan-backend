import {Router} from 'express';
import News from '../models/News.js';
const router=Router();
router.get('/sitemap.xml', async(req,res)=>{
  const base=process.env.CLIENT_URL||'http://localhost:5173';
  const news=await News.find({status:'published'}).sort({updatedAt:-1}).limit(1000);
  const paths=['','/about','/contact',...news.map(n=>`/article/${n.slug}`)];
  const urls=paths.map(u=>`<url><loc>${base}${u}</loc></url>`).join('');
  res.type('xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});
export default router;
