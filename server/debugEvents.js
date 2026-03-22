require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function debugEvents() {
  await connectDB();
  
  const devfolioEvents = await Event.find({ source: 'devfolio' }).limit(5).lean();
  devfolioEvents.forEach(e => {
    console.log(`- Name: ${e.name}`);
    console.log(`  _id: ${e._id}`);
    console.log(`  slug: ${JSON.stringify(e.slug)} (type: ${typeof e.slug})`);
    console.log(`  link: ${e.registrationLink}`);
  });

  mongoose.connection.close();
}

debugEvents();
