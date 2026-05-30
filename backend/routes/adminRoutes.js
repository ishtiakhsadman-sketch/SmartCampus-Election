const express = require("express");
const adminController = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/candidates", adminController.getCandidates);
router.put("/candidates/:id/status", adminController.updateCandidateStatus);
router.get("/voters", adminController.getVoters);
router.get("/voters/export", adminController.exportVotersCSV);
router.put("/voters/:id/verify", adminController.toggleVoterVerification);

router.get("/positions", adminController.getPositions);
router.post("/positions", adminController.createPosition);
router.put("/positions/:id", adminController.updatePosition);
router.delete("/positions/:id", adminController.deletePosition);
router.get("/notices", adminController.getNotices);
router.post("/notices", adminController.createNotice);
router.put("/notices/:id", adminController.updateNotice);
router.delete("/notices/:id", adminController.deleteNotice);
router.put("/notices/:id/publish", adminController.toggleNoticePublish);
router.get("/election-setup", adminController.getElectionSetup);
router.put("/election-setup", adminController.updateElectionSetup);
router.get("/results", adminController.getResults);
router.put("/results/publish", adminController.toggleResultsPublish);
router.get("/audit-log", adminController.getAuditLog);

module.exports = router;
