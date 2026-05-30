const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');
const Position = require('./models/Position');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartcampus')
.then(async () => {
  console.log("Connected!");

  const positions = await Position.find().sort({ createdAt: -1 }).lean();
  console.log("Positions found:", positions.length);

  const candidateCounts = await Candidate.aggregate([
    { $match: { status: "Approved" } },
    {
      $group: {
        _id: { $toLower: { $trim: { input: "$desiredPosition" } } },
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = {};
  candidateCounts.forEach(({ _id, count }) => {
    if (_id) countMap[_id] = count;
  });

  console.log("\nCount map (aggregation):", countMap);

  const result = positions.map((pos) => ({
    title: pos.title,
    candidateCount: countMap[pos.title.trim().toLowerCase()] || 0
  }));

  console.log("\nFinal result:");
  result.forEach(r => console.log(`  ${r.title}: ${r.candidateCount}`));

  process.exit(0);
});
