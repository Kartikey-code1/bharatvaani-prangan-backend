import mongoose from 'mongoose';
const schema = new mongoose.Schema({ email:{type:String,unique:true} }, {timestamps:true});
export default mongoose.model('Subscriber', schema);
