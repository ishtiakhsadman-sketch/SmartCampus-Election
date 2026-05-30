const Vote = require("../models/Vote");
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Position = require("../models/Position");
const Notice = require("../models/Notice");
const ElectionSetup = require("../models/ElectionSetup");
const AuditLog = require("../models/AuditLog");

/* =========================================
   Get Dashboard Analytics
========================================= */

exports.getDashboard = async (req, res) => {
  try {
    const totalVotes = await Vote.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const votedStudents = await Vote.distinct("voter");
    const turnout =
      totalStudents > 0
        ? ((votedStudents.length / totalStudents) * 100).toFixed(2)
        : 0;

    return res.json({
      success: true,
      dashboard: {
        totalVotes,
        totalCandidates,
        totalStudents,
        votedStudents: votedStudents.length,
        turnout
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard."
    });
  }
};

/* =========================================
   Get All Candidates
========================================= */

exports.getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      candidates
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load candidates."
    });
  }
};

/* =========================================
   Update Candidate Status
========================================= */

exports.updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status."
      });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found."
      });
    }

    // Log action
    await AuditLog.create({
      admin: req.user.email,
      action: `Updated candidate status to ${status}`,
      module: "Candidates",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "Candidate status updated successfully.",
      candidate
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update candidate status."
    });
  }
};

/* =========================================
   Get All Voters  (live votingStatus from Vote collection)
========================================= */

exports.getVoters = async (req, res) => {
  try {
    const voters = await User.find({ role: { $in: ["student", "both"] } })
      .select("name studentId email department session verificationStatus")
      .lean();

    // Get the set of student _ids who have cast at least one vote
    const votedIds = await Vote.distinct("voter");
    const votedSet = new Set(votedIds.map(String));

    const result = voters.map((v) => ({
      ...v,
      votingStatus: votedSet.has(String(v._id)) ? "Voted" : "Not Voted"
    }));

    return res.json({ success: true, voters: result });
  } catch (error) {
    console.error("getVoters error:", error);
    return res.status(500).json({ success: false, message: "Failed to load voters." });
  }
};

/* =========================================
   Toggle Voter Verification
========================================= */

exports.toggleVoterVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Voter not found." });
    }

    // Toggle between Verified and Pending
    const newStatus = user.verificationStatus === "Verified" ? "Pending" : "Verified";
    user.verificationStatus = newStatus;
    await user.save();

    await AuditLog.create({
      admin: req.user.email,
      action: `Changed voter verification status to ${newStatus} for ${user.email}`,
      module: "Voters",
      status: "Success"
    });

    return res.json({
      success: true,
      message: `Voter is now ${newStatus}.`,
      verificationStatus: newStatus
    });
  } catch (error) {
    console.error("toggleVoterVerification error:", error);
    return res.status(500).json({ success: false, message: "Failed to update verification status." });
  }
};

/* =========================================
   Export Voters as CSV
========================================= */

exports.exportVotersCSV = async (req, res) => {
  try {
    const voters = await User.find({ role: { $in: ["student", "both"] } })
      .select("name studentId email department session verificationStatus")
      .lean();

    const votedIds = await Vote.distinct("voter");
    const votedSet = new Set(votedIds.map(String));

    const rows = voters.map((v) => {
      const votingStatus = votedSet.has(String(v._id)) ? "Voted" : "Not Voted";
      // Escape fields for CSV
      const escape = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
      return [
        escape(v.name),
        escape(v.studentId),
        escape(v.email),
        escape(v.department),
        escape(v.session),
        escape(v.verificationStatus),
        escape(votingStatus)
      ].join(",");
    });

    const csv = [
      "Name,Student ID,Email,Department,Session,Verification Status,Voting Status",
      ...rows
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="voters-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("exportVotersCSV error:", error);
    return res.status(500).json({ success: false, message: "Failed to export voters." });
  }
};


/* =========================================
   Get All Positions
========================================= */

exports.getPositions = async (req, res) => {
  try {
    const positions = await Position.find().sort({ createdAt: -1 }).lean();

    // Build candidate counts using a single aggregation query for efficiency
    const candidateCounts = await Candidate.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$desiredPosition" } } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Build a lookup map: lowercased position title -> count
    const countMap = {};
    candidateCounts.forEach(({ _id, count }) => {
      if (_id) countMap[_id] = count;
    });

    const positionsWithCount = positions.map((pos) => ({
      ...pos,
      candidateCount: countMap[pos.title.trim().toLowerCase()] || 0
    }));

    return res.json({
      success: true,
      positions: positionsWithCount
    });
  } catch (error) {
    console.error("getPositions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load positions."
    });
  }
};


/* =========================================
   Create Position
========================================= */

exports.createPosition = async (req, res) => {
  try {
    const { title, seats, responsibility } = req.body;

    if (!title || !seats || !responsibility) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    const position = new Position({
      title,
      seats,
      responsibility
    });

    await position.save();

    await AuditLog.create({
      admin: req.user.email,
      action: `Created position: ${title}`,
      module: "Positions",
      status: "Success"
    });

    return res.status(201).json({
      success: true,
      message: "Position created successfully.",
      position
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create position."
    });
  }
};

/* =========================================
   Update Position
========================================= */

exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, seats, responsibility } = req.body;

    const position = await Position.findByIdAndUpdate(
      id,
      { title, seats, responsibility },
      { new: true }
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found."
      });
    }

    await AuditLog.create({
      admin: req.user.email,
      action: `Updated position: ${title}`,
      module: "Positions",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "Position updated successfully.",
      position
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update position."
    });
  }
};

/* =========================================
   Delete Position
========================================= */

exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByIdAndDelete(id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found."
      });
    }

    await AuditLog.create({
      admin: req.user.email,
      action: `Deleted position: ${position.title}`,
      module: "Positions",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "Position deleted successfully."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete position."
    });
  }
};

/* =========================================
   Get All Notices
========================================= */

exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      notices
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load notices."
    });
  }
};

/* =========================================
   Create Notice
========================================= */

exports.createNotice = async (req, res) => {
  try {
    const { title, category, date, summary, details, published } = req.body;

    if (!title || !category || !date) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and date are required."
      });
    }

    const notice = new Notice({
      title,
      category,
      date,
      summary,
      details,
      // Respect published flag sent by admin form; default to false if omitted
      published: published === true || published === "true" ? true : false
    });

    await notice.save();

    await AuditLog.create({
      admin: req.user.email,
      action: `Created notice: ${title}`,
      module: "Notices",
      status: "Success"
    });

    return res.status(201).json({
      success: true,
      message: "Notice created successfully.",
      notice
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create notice."
    });
  }
};

/* =========================================
   Update Notice
========================================= */

exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, date, summary, details, published } = req.body;

    // Build update payload; only include published if explicitly sent
    const updateFields = { title, category, date, summary, details };
    if (published !== undefined) {
      updateFields.published = published === true || published === "true" ? true : false;
    }

    const notice = await Notice.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found."
      });
    }

    await AuditLog.create({
      admin: req.user.email,
      action: `Updated notice: ${title}`,
      module: "Notices",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "Notice updated successfully.",
      notice
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notice."
    });
  }
};

/* =========================================
   Delete Notice
========================================= */

exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found."
      });
    }

    await AuditLog.create({
      admin: req.user.email,
      action: `Deleted notice: ${notice.title}`,
      module: "Notices",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "Notice deleted successfully."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notice."
    });
  }
};

/* =========================================
   Toggle Notice Publish Status
========================================= */

exports.toggleNoticePublish = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found."
      });
    }

    notice.published = !notice.published;
    await notice.save();

    await AuditLog.create({
      admin: req.user.email,
      action: `${notice.published ? "Published" : "Unpublished"} notice: ${notice.title}`,
      module: "Notices",
      status: "Success"
    });

    return res.json({
      success: true,
      message: `Notice ${notice.published ? "published" : "unpublished"} successfully.`,
      notice
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle notice publish status."
    });
  }
};

/* =========================================
   Get Election Setup
========================================= */

exports.getElectionSetup = async (req, res) => {
  try {
    let setup = await ElectionSetup.findOne();

    if (!setup) {
      setup = new ElectionSetup();
      await setup.save();
    }

    return res.json({
      success: true,
      setup
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load election setup."
    });
  }
};

/* =========================================
   Update Election Setup
========================================= */

exports.updateElectionSetup = async (req, res) => {
  try {
    const {
      title,
      session,
      nominationDates,
      scrutinyDates,
      campaignPeriod,
      votingPeriod,
      resultsPublishDate,
      phase,
      votingEnabled
    } = req.body;

    let setup = await ElectionSetup.findOne();

    if (!setup) {
      setup = new ElectionSetup();
    }

    setup.title = title || setup.title;
    setup.session = session || setup.session;
    setup.nominationDates = nominationDates || setup.nominationDates;
    setup.scrutinyDates = scrutinyDates || setup.scrutinyDates;
    setup.campaignPeriod = campaignPeriod || setup.campaignPeriod;
    setup.votingPeriod = votingPeriod || setup.votingPeriod;
    setup.resultsPublishDate = resultsPublishDate || setup.resultsPublishDate;
    setup.phase = phase || setup.phase;
    setup.votingEnabled = votingEnabled !== undefined ? votingEnabled : setup.votingEnabled;

    await setup.save();

    await AuditLog.create({
      admin: req.user.email,
      action: "Updated election setup",
      module: "ElectionSetup",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "Election setup updated successfully.",
      setup
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update election setup."
    });
  }
};

/* =========================================
   Get Election Results
========================================= */

exports.getResults = async (req, res) => {
  try {
    const User = require("../models/User");
    const Vote = require("../models/Vote");
    const Candidate = require("../models/Candidate");
    const Position = require("../models/Position");
    const ElectionSetup = require("../models/ElectionSetup");

    const setup = await ElectionSetup.findOne();
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

    return res.json({
      success: true,
      data: {
        resultsPublished: setup?.resultsPublished || false,
        totalEligibleVoters,
        totalVotesCast: votesCast,
        turnoutRate,
        resultStatus: setup?.resultsPublished ? "Officially Published" : "Counting In Progress",
        positions: positionsData
      }
    });
  } catch (error) {
    console.error("Admin getResults error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load results preview."
    });
  }
};


/* =========================================
   Toggle Results Publish
========================================= */

exports.toggleResultsPublish = async (req, res) => {
  try {
    let setup = await ElectionSetup.findOne();

    if (!setup) {
      setup = new ElectionSetup();
    }

    setup.resultsPublished = !setup.resultsPublished;
    await setup.save();

    await AuditLog.create({
      admin: req.user.email,
      action: `${setup.resultsPublished ? "Published" : "Unpublished"} results`,
      module: "Results",
      status: "Success"
    });

    return res.json({
      success: true,
      message: `Results ${setup.resultsPublished ? "published" : "unpublished"} successfully.`,
      resultsPublished: setup.resultsPublished
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle results publish status."
    });
  }
};

/* =========================================
   Get Audit Log
========================================= */

exports.getAuditLog = async (req, res) => {
  try {
    const auditLogs = await AuditLog.find().sort({ datetime: -1 }).limit(100);

    return res.json({
      success: true,
      auditLogs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load audit log."
    });
  }
};

/* =========================================
   Get Election Results (Legacy)
========================================= */

exports.getElectionResults = async (req, res) => {
  try {
    const results = await Vote.aggregate([
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          as: "candidate"
        }
      },
      {
        $unwind: "$candidate"
      },
      {
        $group: {
          _id: {
            position: "$position",
            candidateId: "$candidate._id",
            candidateName: "$candidate.fullName"
          },
          totalVotes: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          "_id.position": 1,
          totalVotes: -1
        }
      }
    ]);

    return res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load results."
    });
  }
};

/* =========================================
   Get Vote Analytics
========================================= */

exports.getVoteAnalytics = async (req, res) => {
  try {
    const totalVotes = await Vote.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const totalStudents = await User.countDocuments({
      role: "student"
    });
    const votedStudents = await Vote.distinct("voter");
    const turnout =
      totalStudents > 0
        ? ((votedStudents.length / totalStudents) * 100).toFixed(2)
        : 0;

    return res.json({
      success: true,
      analytics: {
        totalVotes,
        totalCandidates,
        totalStudents,
        votedStudents: votedStudents.length,
        turnout
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load analytics."
    });
  }
};

/* =========================================
   Get All Votes
========================================= */

exports.getAllVotes = async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate("voter", "fullName studentId")
      .populate("candidate", "fullName desiredPosition")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      votes
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load votes."
    });
  }
};

/* =========================================
   Reset Votes
========================================= */

exports.resetElectionVotes = async (req, res) => {
  try {
    await Vote.deleteMany({});

    await AuditLog.create({
      admin: req.user.email,
      action: "Reset all election votes",
      module: "Votes",
      status: "Success"
    });

    return res.json({
      success: true,
      message: "All election votes reset successfully."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset votes."
    });
  }
};