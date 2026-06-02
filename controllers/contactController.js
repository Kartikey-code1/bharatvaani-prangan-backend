import ContactMessage from '../models/ContactMessage.js';
import { sendContactEmail } from '../services/emailService.js';
export async function submitContact(req,res){ const msg=await ContactMessage.create(req.body); await sendContactEmail(msg); res.status(201).json({message:'Message sent'}); }
export async function listContacts(req,res){ res.json(await ContactMessage.find().sort({createdAt:-1})); }
