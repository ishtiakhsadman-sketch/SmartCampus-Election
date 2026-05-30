const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Position = require("../models/Position");
const Notice = require("../models/Notice");
const Vote = require("../models/Vote");
const ElectionSetup = require("../models/ElectionSetup");
const AuditLog = require("../models/AuditLog");

const candidatesData = require("./candidates.json");
const votersData = require("../data/voters.json");

dotenv.config();

const basePositions = [
  { id: 1,  title: "Vice President (VP)",                              seats: 1, responsibility: "Supports executive leadership, policy implementation, and student representation." },
  { id: 2,  title: "General Secretary (GS)",                          seats: 1, responsibility: "Coordinates organizational activities, meetings, and strategic decisions." },
  { id: 3,  title: "Assistant General Secretary (AGS)",               seats: 1, responsibility: "Assists the General Secretary in operations and event coordination." },
  { id: 4,  title: "Secretary of Liberation War & Democratic Movement", seats: 1, responsibility: "Promotes democratic values, historical awareness, and commemorative activities." },
  { id: 5,  title: "Science & Technology Secretary",                  seats: 1, responsibility: "Supports innovation, science programs, and technology initiatives." },
  { id: 6,  title: "International Secretary",                         seats: 1, responsibility: "Encourages international student engagement and global collaboration." },
  { id: 7,  title: "Literature & Cultural Secretary",                 seats: 1, responsibility: "Promotes literature, arts, performance, and cultural inclusion." },
  { id: 8,  title: "Research & Publication Secretary",                seats: 1, responsibility: "Supports research engagement, publications, and academic development." },
  { id: 9,  title: "Student Transportation Secretary",                seats: 1, responsibility: "Addresses student transport concerns and transit coordination." },
  { id: 10, title: "Social Service Secretary",                        seats: 1, responsibility: "Leads volunteering, outreach, and community service initiatives." },
  { id: 11, title: "Career Development Secretary",                    seats: 1, responsibility: "Focuses on internships, job readiness, and career support." },
  { id: 12, title: "Health & Environment Secretary",                  seats: 1, responsibility: "Promotes wellness awareness, health support, and sustainability." },
  { id: 13, title: "Human Rights & Law Secretary",                    seats: 1, responsibility: "Supports fairness, rights awareness, and legal guidance initiatives." },
  { id: 14, title: "Communication, Media & Cafeteria Secretary",      seats: 1, responsibility: "Handles communication, campus media visibility, and cafeteria concerns." },
  { id: 15, title: "Sports Secretary",                                seats: 1, responsibility: "Promotes sports programs, tournaments, and student fitness engagement." },
  { id: 16, title: "Executive Committee Member",                      seats: 6, responsibility: "Supports committee decision-making and broad student representation." }
];

const positions = basePositions.map((pos) => ({
  ...pos,
  candidateCount: candidatesData.filter((c) => c.desiredPosition === pos.title).length
}));

const notices = [
  { id: 1, title: "Nomination Form Submission Deadline Extended", category: "Deadline",      date: "2026-04-05", summary: "The election office has extended the nomination form submission deadline by two days.", details: "Students interested in contesting may now submit nomination forms until 5:00 PM on April 5, 2026. All previously announced documentation requirements remain unchanged.", published: true },
  { id: 2, title: "Candidate Verification Process Begins",        category: "Verification",  date: "2026-04-07", summary: "Initial document verification for submitted candidates will begin this week.", details: "The verification committee will review academic, disciplinary, and eligibility documents. Candidates are advised to keep their sample profile information updated.", published: true },
  { id: 3, title: "Official Candidate List Publication",          category: "Announcement", date: "2026-04-10", summary: "The approved candidate list will be published on the candidate directory page.", details: "After the verification process, the official candidate list will be displayed on the Candidates page along with position information and profile access.", published: true },
  { id: 4, title: "Campaign Guidelines Released",                 category: "Policy",       date: "2026-04-11", summary: "Candidates must follow approved communication standards during the campaign period.", details: "Campaign content must remain respectful, factual, and free from harassment. Digital campaign communication should remain within approved campus channels.", published: true },
  { id: 5, title: "Voting Schedule Confirmed",                    category: "Schedule",     date: "2026-05-19", summary: "The election office has confirmed the official voting date and time.", details: "Voting will open on May 19, 2026 at 5:30 PM. Students are requested to review candidates and prepare their ballot carefully before submission.", published: true }
];

async function seedData() {
  try {
    await connectDB();

    // Wipe all collections
    await Promise.all([
      // Only wipe admin + candidate User records — student self-registrations are PRESERVED
      User.deleteMany({ role: { $in: ["admin", "candidate"] } }),
      Candidate.deleteMany(),
      Position.deleteMany(),
      Notice.deleteMany(),
      Vote.deleteMany(),
      ElectionSetup.deleteMany(),
      AuditLog.deleteMany()
    ]);

    const studentPassword = await bcrypt.hash("Student@12345", 10);
    const adminPassword   = await bcrypt.hash("Admin@12345",   10);
    const atikaPassword   = await bcrypt.hash("Atika miss",    10);

    // ── Admin accounts (always recreate — admins were just deleted above) ———
    const adminUser = await User.findOneAndUpdate(
      { studentId: "ADMIN-001" },
      { name: "Admin User", studentId: "ADMIN-001", email: "admin@smartcampus.edu",
        password: adminPassword, role: "admin", department: "Election Office",
        session: "2025-26", phone: "+8801700000002", verificationStatus: "Verified" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findOneAndUpdate(
      { studentId: "ADMIN-ATIKA" },
      { name: "Atika Miss", studentId: "ADMIN-ATIKA", email: "atika@smartcampus.edu",
        password: atikaPassword, role: "admin", department: "Election Office",
        session: "2025-26", phone: "+8801700000009", verificationStatus: "Verified" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Demo student (upsert — preserve if already registered) ————————
    await User.updateOne(
      { studentId: "SC-2026-1001" },
      {
        $setOnInsert: {
          name: "Rahim Uddin", studentId: "SC-2026-1001", email: "student@smartcampus.edu",
          password: studentPassword, role: "student", department: "Computer Science",
          session: "2022-23", phone: "+8801700000000", verificationStatus: "Verified"
        }
      },
      { upsert: true }
    );

    // ── BICE-2023 voters  (upsert: create if new, SKIP if already registered) ────
    console.log(`Seeding ${votersData.length} BICE-2023 voters (preserving existing accounts)...`);
    let voterCreated  = 0;
    let voterSkipped  = 0;

    for (const voter of votersData) {
      const emailBase = voter.studentId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const email     = `${emailBase}@smartcampus.edu`;
      const name      = voter.name
        .trim()
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      try {
        // $setOnInsert: only applied when the document is NEW.
        // If a student already exists (matched by studentId), NOTHING is touched —
        // their original email, password, and role are fully preserved.
        const result = await User.updateOne(
          { studentId: voter.studentId },
          {
            $setOnInsert: {
              name,
              studentId: voter.studentId,
              email,
              password: studentPassword,
              role: "student",
              department: "ICE",
              session: "2022-2023",
              phone: "",
              verificationStatus: "Verified"
            }
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          voterCreated++;
        } else {
          voterSkipped++; // existing self-registered student — credentials untouched
        }
      } catch (err) {
        console.warn(`  Warning [${voter.studentId}]: ${err.message}`);
        voterSkipped++;
      }

    }
    const voterCount = voterCreated + voterSkipped;

    console.log(`  ✓ ${voterCount} BICE-2023 voters processed  (${voterCreated} new, ${voterSkipped} already existed \u2014 credentials preserved).`);


    // ── Positions ──────────────────────────────────────────────────
    await Position.insertMany(positions);

    // ── Candidates ─────────────────────────────────────────────────
    const candidateDocs = [];
    for (const c of candidatesData) {
      const cPass = await bcrypt.hash(c.password || "Candidate@12345", 10);
      try {
        // Use findOneAndUpdate so a student who is also a candidate
        // doesn't create a duplicate — we upgrade their role instead.
        const user = await User.findOneAndUpdate(
          { studentId: c.studentId },
          {
            // Always set these (role must become candidate, password refreshed)
            $set: {
              name: c.name,
              email: c.email,
              password: cPass,
              role: "candidate",
              department: c.department,
              session: c.session,
              phone: c.phone || "+8801700000001",
              verificationStatus: c.verificationStatus || "Verified"
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        candidateDocs.push({
          userId: user._id,
          fullName: c.name,
          studentId: c.studentId,
          department: c.department,
          session: c.session,
          desiredPosition: c.desiredPosition,
          bio: c.bio || c.manifesto || "",
          shortBio: c.manifesto ? c.manifesto.substring(0, 80) + "..." : "Committed to student leadership and campus development.",
          manifesto: c.manifesto || "I will work for transparent elections, student welfare, and better campus services.",
          achievements: c.achievements || "Student leadership, Campus engagement",
          photoPlaceholder: c.photoPlaceholder || "Photo Placeholder",
          documentsPlaceholder: c.documentsPlaceholder || "Document Placeholder",
          slogan: c.slogan || "Leadership for students",
          contactPlaceholder: c.email,
          status: c.status || "Approved"
        });
      } catch (err) {
        console.warn(`  Candidate warning [${c.studentId}]: ${err.message}`);
      }
    }


    await Candidate.insertMany(candidateDocs);

    // ── Notices ────────────────────────────────────────────────────
    await Notice.insertMany(notices);

    // ── Election Setup ─────────────────────────────────────────────
    await ElectionSetup.create({
      title: "SmartCampus Election", session: "2025-26",
      nominationDates: "Apr 2 - Apr 5", scrutinyDates: "Apr 6 - Apr 8",
      campaignPeriod: "Apr 11 - Apr 17", votingPeriod: "May 19, 2026 at 5:30 PM",
      resultsPublishDate: "May 21, 2026", phase: "Voting",
      votingEnabled: true, resultsPublished: false
    });

    // ── Audit Log ──────────────────────────────────────────────────
    await AuditLog.create([
      { admin: adminUser.name, action: "Seeded Database",                                    module: "System",     status: "Success" },
      { admin: adminUser.name, action: `Created ${voterCount} BICE-2023 Voter Accounts`,     module: "Users",      status: "Success" },
      { admin: adminUser.name, action: `Created ${candidateDocs.length} Candidate Accounts`, module: "Candidates", status: "Success" },
      { admin: adminUser.name, action: "Created Election Setup",                              module: "Setup",      status: "Success" }
    ]);

    // ── Summary ────────────────────────────────────────────────────
    console.log("\nSeed completed successfully.");
    console.log("─".repeat(52));
    console.log("Login credentials:");
    console.log("  Admin   : admin@smartcampus.edu  /  Admin@12345");
    console.log("  Admin 2 : ADMIN-ATIKA             /  Atika miss");
    console.log("  Student : student@smartcampus.edu /  Student@12345");
    console.log("\nBICE-2023 voter login (studentId as username):");
    console.log("  23549009090 / Student@12345   ← Fahim Ahmed");
    console.log("  2154901062  / Student@12345   ← Akhear Iram");
    console.log("\nCandidate login:");
    console.log("  Use studentId from candidates.json  /  Candidate@12345");
    console.log("─".repeat(52));
    console.log(`Total voters seeded  : ${voterCount}`);
    console.log(`Total candidates     : ${candidateDocs.length}`);
    console.log("\nCandidate counts per position:");
    positions.forEach(p => console.log(`  ${p.title}: ${p.candidateCount}`));

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedData();