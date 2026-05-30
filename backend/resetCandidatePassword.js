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

    const candidateStudentId = "CAND-018";
    const candidateEmail = "candidate18@smartcampus.edu";
    const newPassword = "candidate123";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let user = await User.findOne({
      $or: [
        { studentId: candidateStudentId },
        { email: candidateEmail }
      ]
    });

    if (!user) {
      user = await User.create({
        name: "Imran Kabir",
        studentId: candidateStudentId,
        email: candidateEmail,
        password: hashedPassword,
        role: "candidate",
        department: "Physical Education",
        session: "2021-22",
        phone: "",
        verificationStatus: "Verified"
      });

      console.log("Candidate user account created.");
    } else {
      user.name = user.name || "Imran Kabir";
      user.studentId = candidateStudentId;
      user.email = candidateEmail;
      user.password = hashedPassword;
      user.role = "candidate";
      user.department = user.department || "Physical Education";
      user.session = user.session || "2021-22";
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
    console.log("ID / Email: CAND-018");
    console.log("or Email: candidate18@smartcampus.edu");
    console.log("Password: candidate123");
    console.log("--------------------------------");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await mongoose.disconnect();
  }
}

resetCandidatePassword();