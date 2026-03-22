require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function analyzeDuplicates() {
  await connectDB();
  
  const devfolioEvents = await Event.find({ source: 'devfolio' }).sort({ createdAt: 1 }).lean();
  console.log(`Total Devfolio events: ${devfolioEvents.length}`);
  
  // Look at the first few events (likely the old ones) and the last few (new ones)
  console.log("\nOldest:");
  devfolioEvents.slice(0, 2).forEach(e => console.log(`_id: ${e._id}, name: ${e.name}, slug: ${e.slug}, link: ${e.registrationLink}`));
  
  console.log("\nNewest:");
  devfolioEvents.slice(-2).forEach(e => console.log(`_id: ${e._id}, name: ${e.name}, slug: ${e.slug}, link: ${e.registrationLink}`));

  mongoose.connection.close();
}

analyzeDuplicates();
