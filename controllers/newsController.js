import slugify from 'slugify';
import News from '../models/News.js';
import { publishEverywhere } from '../services/newsService.js';
export async function getNews(req,res){ res.json(await News.find({status:'published'}).sort({createdAt:-1}).limit(50)); }
export async function createNews(req,res){
  const slug = slugify(req.body.headline || 'news', {lower:true,strict:true}) + '-' + Date.now();
  const news = await News.create({...req.body, slug, featuredImage:req.file?.path});
  if(req.body.publishEverywhere === 'true') await publishEverywhere(news);
  res.status(201).json(news);
}
export async function updateNews(req,res){ res.json(await News.findByIdAndUpdate(req.params.id, req.body, {new:true})); }
export async function deleteNews(req,res){ await News.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); }
