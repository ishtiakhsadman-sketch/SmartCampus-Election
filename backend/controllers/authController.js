const PasswordResetOtp = require("../models/PasswordResetOtp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const Candidate = require("../models/Candidate");
const OtpVerification = require("../models/OtpVerification");

function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function roleRedirect(role) {
  if (role === "admin") return "admin-dashboard.html";
  if (role === "candidate" || role === "both") return "candidate-dashboard.html";
  return "student-dashboard.html";
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    studentId: user.studentId,
    email: user.email,
    role: user.role,
    department: user.department,
    session: user.session,
    phone: user.phone,
    verificationStatus: user.verificationStatus
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOtpExpiryDate() {
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES || 5);
  return new Date(Date.now() + minutes * 60 * 1000);
}

function getResendAvailableDate() {
  return new Date(Date.now() + 60 * 1000);
}

function secondsUntil(date) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 1000));
}

function createEmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendOtpEmail(toEmail, otpCode, studentName) {
  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: `"SmartCampus Election" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "SmartCampus Election Registration OTP",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
        <h2 style="color: #146b3a;">SmartCampus Election Registration</h2>
        <p>Hello ${studentName || "Student"},</p>
        <p>Your OTP for SmartCampus Election registration is:</p>

        <div style="font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #c62828; margin: 18px 0;">
          ${otpCode}
        </div>

        <p>This OTP will expire in ${process.env.OTP_EXPIRES_MINUTES || 5} minutes.</p>
        <p>If you did not request this OTP, you can ignore this email.</p>
      </div>
    `
  });
}

/* Normal register route kept so old register API does not break */
exports.register = async (req, res) => {
  try {
    const {
      name,
      studentName,
      studentId,
      email,
      studentEmail,
      password,
      role = "student",
      department,
      studentDepartment,
      session,
      studentSession,
      phone,
      studentPhone
    } = req.body;

    const finalEmail = normalizeEmail(email || studentEmail);
    const finalName = name || studentName;
    const finalDepartment = department || studentDepartment || "";
    const finalSession = session || studentSession || "";
    const finalPhone = phone || studentPhone || "";

    if (!finalName || !studentId || !finalEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, student ID, email, and password are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: finalEmail }, { studentId }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or student ID"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: finalName,
      studentId,
      email: finalEmail,
      password: hashedPassword,
      role,
      department: finalDepartment,
      session: finalSession,
      phone: finalPhone,
      verificationStatus: "Verified"
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: publicUser(user),
      redirect: roleRedirect(user.role)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
};

/* Send OTP before registration */
exports.sendRegisterOtp = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentDepartment,
      studentSession,
      studentEmail,
      email,
      studentPhone,
      password,
      role = "student"
    } = req.body;

    const finalEmail = normalizeEmail(email || studentEmail);

    if (!studentId || !studentName || !finalEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID, name, email, and password are required before sending OTP"
      });
    }

    if (role !== "student" && role !== "candidate" && role !== "both") {
      return res.status(400).json({
        success: false,
        message: "OTP registration is available for student, candidate, and both-role accounts only"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: finalEmail }, { studentId }]
    });

    if (existingUser) {
      if (
        (existingUser.role === "student" || existingUser.role === "both") &&
        (role === "candidate" || role === "both")
      ) {
        // Allow existing student to apply as candidate / both
      } else {
        return res.status(409).json({
          success: false,
          message: "An account already exists with this email or student ID"
        });
      }
    }

    const existingOtp = await OtpVerification.findOne({
      $or: [{ email: finalEmail }, { studentId }]
    });

    if (existingOtp && existingOtp.resendAvailableAt > new Date()) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsUntil(existingOtp.resendAvailableAt)} seconds before requesting another OTP`,
        secondsRemaining: secondsUntil(existingOtp.resendAvailableAt)
      });
    }

    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    await OtpVerification.deleteMany({
      $or: [{ email: finalEmail }, { studentId }]
    });

    await OtpVerification.create({
      studentId,
      studentName,
      studentDepartment: studentDepartment || "",
      studentSession: studentSession || "",
      studentEmail: finalEmail,
      email: finalEmail,
      studentPhone: studentPhone || "",
      password: hashedPassword,
      role: role,
      otpHash,
      expiresAt: getOtpExpiryDate(),
      resendAvailableAt: getResendAvailableDate()
    });

    await sendOtpEmail(finalEmail, otpCode, studentName);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
      resendAfterSeconds: 60,
      expiresInMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 5)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not send OTP. Please check email settings and try again."
    });
  }
};

/* Verify OTP and create user */
exports.registerWithOtp = async (req, res) => {
  try {
    const { studentId, studentEmail, email, otpCode } = req.body;

    const finalEmail = normalizeEmail(email || studentEmail);
    const finalOtp = String(otpCode || "").trim();

    if (!studentId || !finalEmail || !finalOtp) {
      return res.status(400).json({
        success: false,
        message: "Student ID, email, and OTP are required"
      });
    }

    let user;

    const otpRecord = await OtpVerification.findOne({
      $or: [{ email: finalEmail }, { studentId }]
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please request a new OTP."
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP."
      });
    }

    const isMatch = await bcrypt.compare(finalOtp, otpRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again."
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: finalEmail }, { studentId }]
    });

    if (existingUser) {
      if (
        (existingUser.role === "student" || existingUser.role === "both") &&
        (otpRecord.role === "candidate" || otpRecord.role === "both")
      ) {
        // Upgrade the user's role to "both" so they keep student + candidate privileges
        existingUser.role = "both";
        await existingUser.save();
        user = existingUser;
      } else {
        return res.status(409).json({
          success: false,
          message: "An account already exists with this email or student ID"
        });
      }
    } else {
      user = await User.create({
        name: otpRecord.studentName,
        studentId: otpRecord.studentId,
        email: otpRecord.email,
        password: otpRecord.password,
        role: otpRecord.role,
        department: otpRecord.studentDepartment,
        session: otpRecord.studentSession,
        phone: otpRecord.studentPhone,
        verificationStatus: "Verified"
      });
    }

    if (user.role === "candidate" || user.role === "both") {
      const { desiredPosition, slogan, manifesto, achievements } = req.body;
      
        await Candidate.findOneAndUpdate(
          { userId: user._id },
          {
            fullName: user.name,
            studentId: user.studentId,
            department: user.department,
            session: user.session,
            desiredPosition: desiredPosition || "",
            shortBio: manifesto ? manifesto.substring(0, 80) + "..." : "",
            manifesto: manifesto || "",
            achievements: achievements || "",
            slogan: slogan || "Leadership with Accountability",
            contactPlaceholder: user.email,
            status: "Pending"
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    await OtpVerification.deleteMany({
      $or: [{ email: finalEmail }, { studentId }]
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: publicUser(user),
      redirect: roleRedirect(user.role)
    });
  } catch (error) {
    console.error("registerWithOtp Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed. Please try again."
    });
  }
};

/* Existing login route */
exports.login = async (req, res) => {
  try {
    const { identity, email, studentId, password, role } = req.body;
    const loginId = identity || email || studentId;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "ID/email and password are required"
      });
    }

    const normalizedLoginId = normalizeEmail(loginId);

    const user = await User.findOne({
      $or: [{ email: normalizedLoginId }, { studentId: loginId }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // A user with role "both" can log in from either the student or candidate tab
    const isBothRole = user.role === "both";
    const roleMatches =
      !role ||
      user.role === role ||
      (isBothRole && (role === "student" || role === "candidate"));

    if (!roleMatches) {
      return res.status(403).json({
        success: false,
        message: `This account is not registered as ${role}`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password"
      });
    }

    const token = createToken(user);

    // For "both" role users, redirect based on WHICH TAB they logged in from:
    // Student tab → student dashboard, Candidate tab → candidate dashboard
    let redirectPage;
    if (user.role === "both") {
      redirectPage = (role === "candidate")
        ? "candidate-dashboard.html"
        : "student-dashboard.html";
    } else {
      redirectPage = roleRedirect(user.role);
    }

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
      redirect: redirectPage,
      loginAs: (user.role === "both") ? role : user.role
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
};

exports.me = async (req, res) => {
  return res.json({
    success: true,
    user: publicUser(req.user)
  });
};
async function sendResetOtpEmail(toEmail, otpCode, userName) {
  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: `"SmartCampus Election" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "SmartCampus Election Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
        <h2 style="color: #146b3a;">SmartCampus Election Password Reset</h2>
        <p>Hello ${userName || "User"},</p>
        <p>Your OTP for resetting your password is:</p>

        <div style="font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #c62828; margin: 18px 0;">
          ${otpCode}
        </div>

        <p>This OTP will expire in ${process.env.OTP_EXPIRES_MINUTES || 5} minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `
  });
}

exports.sendResetOtp = async (req, res) => {
  try {
    const { identity } = req.body;

    if (!identity) {
      return res.status(400).json({
        success: false,
        message: "Email or student ID is required"
      });
    }

    const cleanIdentity = String(identity).trim();
    const normalizedIdentity = cleanIdentity.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentity },
        { studentId: cleanIdentity }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email or student ID"
      });
    }

    const existingOtp = await PasswordResetOtp.findOne({
      userId: user._id
    });

    if (existingOtp && existingOtp.resendAvailableAt > new Date()) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsUntil(existingOtp.resendAvailableAt)} seconds before requesting another OTP`,
        secondsRemaining: secondsUntil(existingOtp.resendAvailableAt)
      });
    }

    const otpCode = generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);

    await PasswordResetOtp.deleteMany({ userId: user._id });

    await PasswordResetOtp.create({
      identity: cleanIdentity,
      email: user.email,
      userId: user._id,
      otpHash,
      expiresAt: getOtpExpiryDate(),
      resendAvailableAt: getResendAvailableDate()
    });

    await sendResetOtpEmail(user.email, otpCode, user.name);

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent successfully. Please check your registered email.",
      resendAfterSeconds: 60,
      expiresInMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 5)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not send reset OTP. Please try again."
    });
  }
};

exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { identity, otpCode, newPassword, confirmNewPassword } = req.body;

    if (!identity || !otpCode || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Identity, OTP, new password, and confirm password are required"
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password should be at least 6 characters long"
      });
    }

    const cleanIdentity = String(identity).trim();
    const normalizedIdentity = cleanIdentity.toLowerCase();
    const cleanOtp = String(otpCode).trim();

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentity },
        { studentId: cleanIdentity }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email or student ID"
      });
    }

    const otpRecord = await PasswordResetOtp.findOne({
      userId: user._id
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP request not found. Please request a new OTP."
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await PasswordResetOtp.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP."
      });
    }

    const isOtpValid = await bcrypt.compare(cleanOtp, otpRecord.otpHash);

    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP. Please check your email and try again."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await PasswordResetOtp.deleteMany({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password reset failed. Please try again."
    });
  }
};

exports.forgotPasswordPlaceholder = async (req, res) => {
  return res.json({
    success: true,
    message: "Password reset placeholder accepted. Real OTP/email reset can be added later."
  });
};