require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function findDuplicates() {
  await connectDB();
  
  const devfolioEvents = await Event.find({ source: 'devfolio' }).lean();
  console.log(`Total Devfolio events: ${devfolioEvents.length}`);
  
  const groups = {};
  devfolioEvents.forEach(e => {
    const key = e.name.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  
  const duplicates = Object.values(groups).filter(g => g.length > 1);
  console.log(`\nFound ${duplicates.length} duplicate groups:`);
  
  duplicates.slice(0, 3).forEach(g => {
    console.log(`\nGroup: ${g[0].name}`);
    g.forEach(e => {
      console.log(`  - _id: ${e._id}, slug: ${e.slug}, link: ${e.registrationLink}`);
    });
  });

  mongoose.connection.close();
}

findDuplicates();
