import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
export async function login(req,res){
  const {email,password}=req.body;
  const admin = await Admin.findOne({email});
  if(!admin) return res.status(401).json({message:'Invalid login'});
  const ok = await bcrypt.compare(password, admin.password);
  if(!ok) return res.status(401).json({message:'Invalid login'});
  res.json({token:jwt.sign({id:admin._id,email}, process.env.JWT_SECRET, {expiresIn:'7d'})});
}
