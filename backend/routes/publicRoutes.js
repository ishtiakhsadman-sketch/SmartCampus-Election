const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

router.get("/positions", publicController.getPositions);
router.get("/candidates", publicController.getCandidates);
router.get("/candidates/:id", publicController.getCandidateById);
router.get("/notices", publicController.getNotices);
router.get("/schedule", publicController.getSchedule);
router.get("/election-setup", publicController.getElectionSetup);
router.get("/results", publicController.getResults);

module.exports = router;
