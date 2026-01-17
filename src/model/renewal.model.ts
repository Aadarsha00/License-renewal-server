import mongoose from "mongoose";

const renewalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "certificate", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ["khalti"], default: "khalti" },
    paymentStatus: { type: String, enum: ["pending", "success", "failed"], default: "success" },
    adminStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    cancelReason: { type: String }, // if rejected
    renewedUntil: { type: Date }, // new expiry after renewal
    receiptUrl: { type: String }, // downloadable payment confirmation
   documentUrl: [{ type: String }], 
  },
  { timestamps: true }
);

export default mongoose.model("renewal", renewalSchema);
