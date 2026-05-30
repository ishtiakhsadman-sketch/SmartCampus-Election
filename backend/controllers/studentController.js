const mongoose = require("mongoose");
const Vote = require("../models/Vote");
const Candidate = require("../models/Candidate");

/* =========================================
   Submit Vote
   Accepts:
   {
     votes: [
       {
         candidateId: string,   // MongoDB ObjectId OR mock numeric ID
         candidateName: string, // name snapshot from frontend
         position: string       // position title
       }
     ]
   }
========================================= */

exports.submitVote = async (req, res) => {
  try {
    const voterId = req.user && req.user._id;
    const { votes } = req.body || {};

    // Enhanced logging for debugging vote submissions
    console.info(`submitVote: voter=${voterId} payload=${JSON.stringify(req.body)}`);

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No votes submitted."
      });
    }

    // Check if this student has already voted (any position)
    const alreadyVoted = await Vote.findOne({ voter: voterId });

    if (alreadyVoted) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted your vote.",
        hasVoted: true
      });
    }

    const createdVotes = [];
    const errors = [];

    for (const item of votes) {
      const rawCandidateId = String(item.candidateId || "").trim();
      const rawPosition = String(item.position || "").trim();
      const rawCandidateName = String(item.candidateName || "").trim();

      if (!rawPosition) {
        errors.push(`Skipped vote: missing position`);
        continue;
      }

      // Skip if already voted for this position (safety guard)
      const existingVoteForPosition = await Vote.findOne({
        voter: voterId,
        position: rawPosition
      });

      if (existingVoteForPosition) {
        errors.push(`Already voted for position: ${rawPosition}`);
        continue;
      }

      // Try to resolve the candidate from the database.
      // This works when the ballot uses real backend candidates (valid ObjectIds).
      // If the candidateId is a mock numeric ID or not found in DB, candidate stays null.
      let candidateObjectId = null;
      let resolvedCandidateName = rawCandidateName;

      const isValidObjectId = mongoose.Types.ObjectId.isValid(rawCandidateId);

      if (isValidObjectId) {
        try {
          const candidateDoc = await Candidate.findById(rawCandidateId);
          if (candidateDoc) {
            candidateObjectId = candidateDoc._id;
            // Use DB name if frontend didn't send one
            if (!resolvedCandidateName) {
              resolvedCandidateName = candidateDoc.fullName || "";
            }
          }
        } catch (lookupErr) {
          // CastError or other DB error — treat as no DB candidate found
          console.warn(`Candidate lookup failed for ID "${rawCandidateId}":`, lookupErr.message);
        }
      }

      // Create the vote record.
      // candidate (ObjectId) will be null for mock-data scenarios — that's OK.
      let vote;
      try {
        vote = await Vote.create({
        voter: voterId,
        candidate: candidateObjectId,       // null if using mock data candidates
        candidateRef: rawCandidateId,       // always store the raw ID string
        candidateName: resolvedCandidateName,
        position: rawPosition
        });
      } catch (createErr) {
        // Log full error for debugging — including duplicate key errors
        console.error(`Vote.create failed for voter=${voterId} position=${rawPosition} candidateRef=${rawCandidateId}:`, createErr);
        errors.push(`Failed to record vote for position ${rawPosition}`);
        continue;
      }

      createdVotes.push(vote);
    }

    if (createdVotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid votes could be recorded. " + (errors.join("; ") || "Please check your selections.")
      });
    }

    return res.status(201).json({
      success: true,
      message: `Vote submitted successfully. ${createdVotes.length} position(s) recorded.`,
      hasVoted: true,
      count: createdVotes.length
    });

  } catch (error) {
    console.error("Vote submit error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while submitting vote."
    });
  }
};

/* =========================================
   Check Vote Status (for logged-in student)
   GET /api/student/vote-status
   Returns { hasVoted: true/false }
========================================= */

exports.checkVoteStatus = async (req, res) => {
  try {
    const voterId = req.user && req.user._id;
    const existingVote = await Vote.findOne({ voter: voterId });

    res.json({
      success: true,
      hasVoted: !!existingVote
    });
  } catch (error) {
    console.error("checkVoteStatus error:", error);
    res.status(500).json({ success: false, message: "Error checking vote status." });
  }
};

/* =========================================
   Dashboard Status — Real-time statuses
   GET /api/student/dashboard-status
========================================= */

exports.getDashboardStatus = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const user = await require("../models/User").findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const ElectionSetup = require("../models/ElectionSetup");
    const setup = await ElectionSetup.findOne() || {};

    const existingVote = await Vote.findOne({ voter: userId });

    res.json({
      success: true,
      data: {
        voteStatus: existingVote ? "Voted" : "Not Voted",
        electionStatus: setup.phase || "Configuration",
        votingEnabled: setup.votingEnabled || false,
        verificationStatus: user.verificationStatus || "Pending",
        profileStatus: (user.department && user.session) ? "Complete" : "Incomplete"
      }
    });
  } catch (error) {
    console.error("getDashboardStatus error:", error);
    res.status(500).json({ success: false, message: "Error fetching dashboard status." });
  }
};

/* =========================================
   Update Profile
   PUT /api/student/profile
========================================= */

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, department, session, email, phone } = req.body;
    
    // Note: We don't update studentId as it's the unique identifier
    const user = await require("../models/User").findByIdAndUpdate(
      userId,
      { name: fullName, department, session, email, phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "Profile updated successfully.", user });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ success: false, message: "Error updating profile." });
  }
};