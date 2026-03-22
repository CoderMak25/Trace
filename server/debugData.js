require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function debugData() {
  await connectDB();
  
  const allEvents = await Event.find({ 
    registrationLink: { $regex: 'devfolio\\.co', $options: 'i' }
  }).lean();
  
  console.log(`Found ${allEvents.length} events with devfolio.co links:`);
  allEvents.forEach(e => {
    console.log(`- ID: ${e._id}, Name: ${e.name}, Source: "${e.source}", Slug: "${e.slug}", Link: ${e.registrationLink}`);
  });

  const sources = await Event.distinct('source');
  console.log(`\nAll sources in DB: ${sources.join(', ')}`);

  mongoose.connection.close();
}

debugData();
