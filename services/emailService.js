import nodemailer from 'nodemailer';
export async function sendContactEmail(msg){
  if(!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return { skipped:true };
  const transporter = nodemailer.createTransport({ service:'gmail', auth:{user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS} });
  return transporter.sendMail({ from:process.env.EMAIL_USER, to:process.env.CONTACT_RECEIVER_EMAIL, subject:msg.subject, text:`${msg.name} <${msg.email}>\n\n${msg.message}` });
}
