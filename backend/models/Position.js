const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    seats: { type: Number, required: true, min: 1 },
    responsibility: { type: String, required: true },
    candidateCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Position", positionSchema);
