import {Router} from 'express';
const router=Router();
router.get('/robots.txt',(req,res)=>{const base=process.env.CLIENT_URL||'http://localhost:5173'; res.type('text').send(`User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml`)});
export default router;
