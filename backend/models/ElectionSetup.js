const mongoose = require("mongoose");

const electionSetupSchema = new mongoose.Schema(
  {
    title: { type: String, default: "SmartCampus Election" },
    session: { type: String, default: "2025-26" },
    nominationDates: { type: String, default: "Apr 2 - Apr 5" },
    scrutinyDates: { type: String, default: "Apr 6 - Apr 8" },
    campaignPeriod: { type: String, default: "Apr 11 - Apr 17" },
    votingPeriod: { type: String, default: "Apr 18 - Apr 19" },
    resultsPublishDate: { type: String, default: "Apr 21, 2026" },
    phase: {
      type: String,
      enum: ["Configuration", "Nomination", "Scrutiny", "Campaign", "Voting", "Counting", "Results Published"],
      default: "Configuration"
    },
    votingEnabled: { type: Boolean, default: false },
    resultsPublished: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ElectionSetup", electionSetupSchema);
