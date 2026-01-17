import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },
email: {
  type: String,
  unique: true,
  sparse: true, // allows null for regular users
},
    password: {
      type: String,
      required: true,
      min: [6, "Password must be at least 6 characters"],
    },
    
    role: { type: String, enum: ["user", "admin"], default: "user" }

  },
  { timestamps: true }
);

const user = mongoose.model("user", userSchema);
export default user;
