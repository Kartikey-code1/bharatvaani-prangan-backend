import mongoose from 'mongoose';
const schema = new mongoose.Schema({ article:{type:mongoose.Schema.Types.ObjectId, ref:'News'}, platform:String, status:String, message:String, retryCount:{type:Number,default:0} }, {timestamps:true});
export default mongoose.model('SocialPostLog', schema);
