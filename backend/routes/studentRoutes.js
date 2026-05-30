const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();

/* =========================================
   TEMP TEST ROUTE
========================================= */

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Student routes working"
  });
});

/* =========================================
   Vote Status — Check if logged-in student
   has already voted in the database.
   GET /api/student/vote-status
========================================= */

router.get("/vote-status", protect, studentController.checkVoteStatus);

/* =========================================
   Dashboard Status
   GET /api/student/dashboard-status
========================================= */

router.get("/dashboard-status", protect, studentController.getDashboardStatus);

/* =========================================
   Submit Vote — Save ballot to MongoDB.
   POST /api/student/vote
========================================= */

router.post("/vote", protect, studentController.submitVote);

/* =========================================
   Update Profile
   PUT /api/student/profile
========================================= */

router.put("/profile", protect, studentController.updateProfile);

module.exports = router;
