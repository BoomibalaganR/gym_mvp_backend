import mongoose from "mongoose";

const FeeSchema = new mongoose.Schema(
  {
    gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    month: { type: Date, required: true }, // 'YYYY-MM-DD' 
    totalAmount:{type: Number, required: true},
    paidAmount: { type: Number, required: true },
    pendingAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["paid", "pending"], default: "pending" },
    paymentType: { type: String, enum: ["cash", "gpay"], default: "cash" },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    dateOfPayment: { type: Date, default: Date.now },
    verifiedByOwner: { type: Boolean, default: false },
    transactionId: { type: String } // optional, for external payments
  },
  { timestamps: true }
);

// Unique index to prevent duplicate fee for same member & month in a gym
FeeSchema.index({ gym: 1, member: 1, month: 1 }, { unique: true });

export default mongoose.model("Fee", FeeSchema);
