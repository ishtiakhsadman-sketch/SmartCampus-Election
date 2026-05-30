const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "candidate", "admin", "both"], required: true, default: "student" },
    department: { type: String, default: "" },
    session: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    verificationStatus: { type: String, enum: ["Verified", "Pending", "Rejected"], default: "Verified" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
