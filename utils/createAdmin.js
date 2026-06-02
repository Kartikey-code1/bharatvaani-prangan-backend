import dotenv from 'dotenv'; import mongoose from 'mongoose'; import bcrypt from 'bcryptjs'; import Admin from '../models/Admin.js';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const email = process.env.ADMIN_EMAIL; const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
await Admin.findOneAndUpdate({email}, {email,password}, {upsert:true});
console.log('Admin ready:', email); process.exit(0);
