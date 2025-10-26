import mongoose from 'mongoose';

const GymSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  phone: { type: String, required: true },
  email:{type: String, required: true, unique: true},
  contact_person: { type: String },
  branches: [{ name: String, address: String }],
    monthlyFee: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.model('Gym', GymSchema);
