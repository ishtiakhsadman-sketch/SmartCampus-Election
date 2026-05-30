const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');
const Position = require('./models/Position');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartcampus')
.then(async () => {
  const title = 'Vice President (VP)';
  const regexPattern = new RegExp('^\\s*' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
  console.log('Regex:', regexPattern);
  const count = await Candidate.countDocuments({ desiredPosition: regexPattern, status: 'Approved' });
  console.log('Count with Regex:', count);
  const countAll = await Candidate.countDocuments({ desiredPosition: 'Vice President (VP)', status: 'Approved' });
  console.log('Count exact string:', countAll);
  
  const c = await Candidate.find({});
  console.log('All candidates desiredPositions:', c.map(x => `"${x.desiredPosition}"`));
  process.exit(0);
});
