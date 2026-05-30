const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    fullName: { type: String, default: "", trim: true },
    studentId: { type: String, default: "", trim: true },
    department: { type: String, default: "", trim: true },
    session: { type: String, default: "", trim: true },
    desiredPosition: { type: String, default: "", trim: true },
    shortBio: { type: String, default: "" },
    manifesto: { type: String, default: "" },
    achievements: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    documents: [
      {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    slogan: { type: String, default: "" },
    contactPlaceholder: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    galleryPhotos: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);
