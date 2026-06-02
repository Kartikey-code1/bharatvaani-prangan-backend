import Subscriber from '../models/Subscriber.js';
import { sendNewsletter } from '../services/newsletterService.js';
export async function subscribe(req,res){ const s=await Subscriber.findOneAndUpdate({email:req.body.email},{email:req.body.email},{upsert:true,new:true}); res.status(201).json(s);}
export async function listSubscribers(req,res){res.json(await Subscriber.find().sort({createdAt:-1}));}
export async function sendLatestNewsletter(req,res){const result=await sendNewsletter(req.body); res.json(result);}
