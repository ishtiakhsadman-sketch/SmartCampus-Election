const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');
const Position = require('./models/Position');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartcampus')
.then(async () => {
  const positions = await Position.find().sort({ createdAt: -1 }).lean();
  const positionsWithCount = await Promise.all(
    positions.map(async (pos) => {
      // NOTE: Here we are trying different things to see what matches!
      
      const regexPattern = new RegExp(`^\\s*${pos.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, "i");
      
      const count = await Candidate.countDocuments({ 
        desiredPosition: regexPattern,
        status: "Approved"
      });
      console.log(`[${pos.title}] Regex:`, regexPattern, `-> count:`, count);
      return { ...pos, candidateCount: count };
    })
  );
  process.exit(0);
});
