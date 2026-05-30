const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    summary: { type: String, default: "" },
    details: { type: String, default: "" },
    published: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);
