import mongoose from 'mongoose';

const FeeSchema = new mongoose.Schema({
  gym_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  dateOfPayment: { type: Date, default: Date.now },
  paymentType: { type: String, enum: ['cash', 'online', 'card', 'upi'], default: 'cash' },
  amount: { type: Number, required: true },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  verifiedByOwner: { type: Boolean, default: false },
  month: { type: String, required: true } // 'YYYY-MM'
}, { timestamps: true });

// Prevent duplicate member+month per gym
FeeSchema.index({ gym_id: 1, member_id: 1, month: 1 }, { unique: true });

export default mongoose.model('Fee', FeeSchema);
