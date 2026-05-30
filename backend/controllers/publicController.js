const Position = require("../models/Position");
const Candidate = require("../models/Candidate");
const Notice = require("../models/Notice");
const ElectionSetup = require("../models/ElectionSetup");
const Vote = require("../models/Vote");

const electionTimeline = [
  { stage: "Election Notice Published", date: "2026-04-01", description: "The official election announcement is released to all students." },
  { stage: "Nomination Submission Opens", date: "2026-04-02", description: "Interested candidates begin submitting nomination forms." },
  { stage: "Nomination Submission Closes", date: "2026-04-05", description: "Final deadline for all candidate submissions and supporting documents." },
  { stage: "Verification & Review", date: "2026-04-07", description: "Election office verifies candidate information and eligibility." },
  { stage: "Official Candidate List Published", date: "2026-04-10", description: "Approved candidates are announced publicly." },
  { stage: "Campaign Period", date: "2026-04-11 to 2026-04-17", description: "Candidates share manifesto and campaign goals through approved channels." },
  { stage: "Voting Period", date: "2026-04-18 to 2026-04-19", description: "Students cast their votes through the online platform." },
  { stage: "Counting & Review", date: "2026-04-20", description: "Votes are counted and reviewed by the election committee." },
  { stage: "Result Publication", date: "2026-04-21", description: "Final election results are officially published." }
];

exports.getPositions = async (req, res) => {
  try {
    const positions = await Position.find().sort({ createdAt: 1 }).lean();

    // Single aggregation to count approved candidates per position
    const candidateCounts = await Candidate.aggregate([
      {
        $match: {
          status: "Approved",
          fullName: { $nin: ["Unnamed Candidate", ""] }
        }
      },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$desiredPosition" } } },
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    candidateCounts.forEach(({ _id, count }) => {
      if (_id) countMap[_id] = count;
    });

    const positionsWithCount = positions.map((pos) => ({
      ...pos,
      candidateCount: countMap[pos.title.trim().toLowerCase()] || 0
    }));

    res.json({ success: true, positions: positionsWithCount });
  } catch (error) {
    console.error("publicController.getPositions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getCandidates = async (req, res) => {
  try {
    let filter;

    if (req.query.all === "true") {
      // Admin/debug mode: return all
      filter = {};
    } else {
      // Public mode: strictly show only Approved candidates
      filter = {
        status: "Approved",
        // Never show stub profiles created only for photo upload
        fullName: { $nin: ["Unnamed Candidate", ""] }
      };
    }

    const candidates = await Candidate.find(filter).sort({ fullName: 1 });
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCandidateById = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found" });
  }
  res.json({ success: true, candidate });
};

exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ published: true }).sort({ createdAt: -1, date: -1 });
    // No-cache header: ensures browser/proxies always get fresh publish state
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.json({ success: true, notices, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSchedule = async (req, res) => {
  res.json({ success: true, timeline: electionTimeline });
};

exports.getElectionSetup = async (req, res) => {
  try {
    const setup = await ElectionSetup.findOne() || {};
    res.json({ success: true, setup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResults = async (req, res) => {
  const setup = await ElectionSetup.findOne();
  const User = require("../models/User");

  if (!setup?.resultsPublished) {
    return res.json({
      success: true,
      published: false,
      message: "Results have not been published yet"
    });
  }

  try {
    const totalEligibleVoters = await User.countDocuments({ role: { $ne: "admin" } });
    const votes = await Vote.find();
    
    const positions = await Position.find().sort({ createdAt: 1 });
    const candidates = await Candidate.find({
      status: "Approved",
      fullName: { $nin: ["Unnamed Candidate", ""] }
    });

    const positionsData = positions.map(pos => {
      const posCandidates = candidates.filter(c => 
        (c.desiredPosition || "").trim().toLowerCase() === pos.title.trim().toLowerCase()
      );
      
      const ranking = posCandidates.map(c => {
        let voteCount = 0;
        votes.forEach(vote => {
          const votePos = (vote.position || "").trim().toLowerCase();
          const targetPos = pos.title.trim().toLowerCase();
          
          if (votePos === targetPos) {
            const cIdStr = c._id ? c._id.toString() : "";
            const vCandIdStr = vote.candidate ? vote.candidate.toString() : "";
            const vCandRef = (vote.candidateRef || "").trim();
            const cStudentId = (c.studentId || "").trim();

            if (
              (vCandIdStr && vCandIdStr === cIdStr) ||
              (vCandRef && (vCandRef === cIdStr || vCandRef === cStudentId))
            ) {
              voteCount++;
            }
          }
        });
        
        return {
          name: c.fullName,
          studentId: c.studentId,
          department: c.department,
          votes: voteCount,
          isWinner: false
        };
      }).sort((a, b) => b.votes - a.votes);

      if (ranking.length > 0) {
        const maxVotes = ranking[0].votes;
        ranking.forEach(r => {
          if (r.votes === maxVotes && r.votes > 0) {
            r.isWinner = true;
          }
        });
      }

      return {
        title: pos.title,
        candidates: ranking
      };
    });

    const votesCast = votes.length;
    const turnoutRate = totalEligibleVoters > 0 
      ? ((votesCast / totalEligibleVoters) * 100).toFixed(1) 
      : "0.0";

    res.json({
      success: true,
      data: {
        resultsPublished: true,
        totalEligibleVoters,
        totalVotesCast: votesCast,
        turnoutRate,
        resultStatus: "Officially Published",
        positions: positionsData
      }
    });
  } catch (error) {
    console.error("Error in getResults:", error);
    res.status(500).json({ success: false, message: "Failed to fetch results." });
  }
};
