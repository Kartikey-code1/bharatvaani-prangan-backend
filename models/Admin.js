import mongoose from 'mongoose';
const adminSchema = new mongoose.Schema({ email:String, password:String }, {timestamps:true});
export default mongoose.model('Admin', adminSchema);
