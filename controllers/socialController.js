import SocialPostLog from '../models/SocialPostLog.js';
export async function listSocialLogs(req,res){res.json(await SocialPostLog.find().sort({createdAt:-1}).limit(100));}
export async function retrySocialPost(req,res){const log=await SocialPostLog.findByIdAndUpdate(req.params.id, {$inc:{retryCount:1}, status:'retry_pending'}, {new:true}); res.json(log);}
