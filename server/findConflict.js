require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function findConflictingLinks() {
  await connectDB();
  
  const conflicted = await Event.find({ 
    registrationLink: { $regex: 'devfolio\\.co', $options: 'i' },
    source: { $ne: 'devfolio' }
  }).lean();
  
  console.log(`Found ${conflicted.length} non-Devfolio events with Devfolio links:`);
  conflicted.forEach(e => {
    console.log(`- ID: ${e._id}, Name: ${e.name}, Source: ${e.source}, Link: ${e.registrationLink}`);
  });

  const allDevfolio = await Event.find({ source: 'devfolio' }).lean();
  console.log(`\nCurrently have ${allDevfolio.length} Devfolio events in DB.`);
  if (allDevfolio.length > 0) {
      console.log("Sample Devfolio events:");
      allDevfolio.slice(0, 3).forEach(e => {
          console.log(`- ID: ${e._id}, Slug: ${e.slug}, Link: ${e.registrationLink}`);
      });
  }

  mongoose.connection.close();
}

findConflictingLinks();
