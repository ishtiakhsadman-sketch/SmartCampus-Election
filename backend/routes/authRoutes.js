const express = require("express");

const {
  register,
  sendRegisterOtp,
  registerWithOtp,
  sendResetOtp,
  resetPasswordWithOtp,
  login,
  me,
  forgotPasswordPlaceholder
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/send-register-otp", sendRegisterOtp);
router.post("/register-with-otp", registerWithOtp);

router.post("/send-reset-otp", sendResetOtp);
router.post("/reset-password-with-otp", resetPasswordWithOtp);

router.post("/login", login);
router.post("/forgot-password-placeholder", forgotPasswordPlaceholder);
router.get("/me", protect, me);

module.exports = router;