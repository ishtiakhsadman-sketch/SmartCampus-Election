const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Candidate = require("./models/Candidate");

dotenv.config();

async function resetCandidatePassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const candidateStudentId = process.env.CANDIDATE_STUDENT_ID || "CAND-001";
    const candidateEmail = process.env.CANDIDATE_EMAIL || "candidate@smartcampus.edu";
    const newPassword = process.env.CANDIDATE_PASSWORD || "defaultPassword123";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let user = await User.findOne({
      $or: [
        { studentId: candidateStudentId },
        { email: candidateEmail }
      ]
    });

    if (!user) {
      user = await User.create({
        name: process.env.CANDIDATE_NAME || "Sample Candidate",
        studentId: candidateStudentId,
        email: candidateEmail,
        password: hashedPassword,
        role: "candidate",
        department: process.env.CANDIDATE_DEPARTMENT || "Engineering",
        session: process.env.CANDIDATE_SESSION || "2021-22",
        phone: process.env.CANDIDATE_PHONE || "",
        verificationStatus: "Verified"
      });

      console.log("Candidate user account created.");
    } else {
      user.name = user.name || (process.env.CANDIDATE_NAME || "Sample Candidate");
      user.studentId = candidateStudentId;
      user.email = candidateEmail;
      user.password = hashedPassword;
      user.role = "candidate";
      user.department = user.department || (process.env.CANDIDATE_DEPARTMENT || "Engineering");
      user.session = user.session || (process.env.CANDIDATE_SESSION || "2021-22");
      user.verificationStatus = "Verified";

      await user.save();

      console.log("Candidate password reset successfully.");
    }

    const candidateProfile = await Candidate.findOne({
      studentId: candidateStudentId
    });

    if (candidateProfile) {
      candidateProfile.userId = user._id;
      await candidateProfile.save();
      console.log("Candidate profile linked with user account.");
    }

    console.log("--------------------------------");
    console.log("Login with:");
    console.log("Role: Candidate");
    console.log("ID / Email: " + candidateStudentId);
    console.log("or Email: " + candidateEmail);
    console.log("Password: [Check your .env file]");
    console.log("--------------------------------");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await mongoose.disconnect();
  }
}

resetCandidatePassword();
