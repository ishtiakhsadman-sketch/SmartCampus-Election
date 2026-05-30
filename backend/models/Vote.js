const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* Optional reference to a real DB Candidate (only populated when
       the ballot uses backend candidates with valid ObjectIds).
       Left null when the ballot uses mock/static data candidates. */
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null
    },

    /* Raw candidate identifier — always stored.
       Either a MongoDB ObjectId string or a mock-data numeric ID string. */
    candidateRef: {
      type: String,
      default: ""
    },

    /* Human-readable candidate name snapshot for result display. */
    candidateName: {
      type: String,
      default: ""
    },

    position: {
      type: String,
      required: true,
      trim: true
    },

    electionId: {
      type: String,
      default: "SMARTCAMPUS_2026"
    }
  },
  {
    timestamps: true
  }
);

/* =========================================
   Prevent duplicate voting per position per student
========================================= */

voteSchema.index(
  {
    voter: 1,
    position: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model("Vote", voteSchema);