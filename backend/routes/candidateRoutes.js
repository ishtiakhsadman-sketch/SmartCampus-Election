const express = require("express");
const candidateController = require("../controllers/candidateController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect, authorizeRoles("candidate"));

router.post("/nomination", upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), candidateController.submitNomination);
router.get("/dashboard", candidateController.getDashboard);
router.get("/profile", candidateController.getProfile);
router.put("/profile", candidateController.updateProfile);
router.get("/campaign-preview", candidateController.getCampaignPreview);

// Photo Management Routes
router.put("/profile-photo", upload.single("photo"), candidateController.uploadProfilePhoto);
router.post("/gallery", upload.array("photos", 5), candidateController.uploadGalleryPhotos);
router.delete("/gallery/:photoId", candidateController.deleteGalleryPhoto);

module.exports = router;
