const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    datetime: { type: Date, default: Date.now },
    status: { type: String, enum: ["Success", "Pending", "Failed"], default: "Success" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
