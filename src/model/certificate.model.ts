import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  certificateNumber: { type: String, required: true, unique: true },
  certificateType: { type: String, required: true },
  holderName: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  lastRenewalDate: { type: Date },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  documentUrl: { type: String },
}, { timestamps: true });

const Certificate = mongoose.model("certificate", certificateSchema);
export default Certificate;
