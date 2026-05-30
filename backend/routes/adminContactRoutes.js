const express = require("express");
const contactController = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/", contactController.getAllContactMessages);
router.patch("/:id/reply", contactController.replyToContactMessage);
router.patch("/:id/status", contactController.updateContactMessageStatus);

module.exports = router;