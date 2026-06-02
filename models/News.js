import mongoose from 'mongoose';
const newsSchema = new mongoose.Schema({
  headline:{type:String,required:true}, shortDescription:String, body:String, category:String,
  tags:[String], status:{type:String,enum:['draft','published'],default:'draft'}, slug:{type:String,unique:true},
  featuredImage:String, seoTitle:String, metaDescription:String, scheduledAt:Date,
  socialStatus:{ facebook:String, instagram:String, youtube:String, x:String }
},{timestamps:true});
export default mongoose.model('News', newsSchema);
