require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function forceSlugs() {
  await connectDB();
  
  const devfolioEvents = await Event.find({ source: 'devfolio' });
  console.log(`Processing ${devfolioEvents.length} events...`);
  
  let updatedCount = 0;
  for (const ev of devfolioEvents) {
    let slug = ev.slug;
    if (!slug && ev.registrationLink) {
      if (ev.registrationLink.includes('.devfolio.co')) {
          // https://subdomain.devfolio.co
          const match = ev.registrationLink.match(/https:\/\/(.+)\.devfolio\.co/);
          if (match) slug = match[1];
      } else {
          // https://devfolio.co/hackathons/slug
          const parts = ev.registrationLink.split('/');
          slug = parts[parts.length - 1];
      }
    }
    
    if (slug) {
      ev.slug = slug;
      await ev.save();
      updatedCount++;
    }
  }

  console.log(`\nUpdated ${updatedCount} events with slugs.`);
  mongoose.connection.close();
}

forceSlugs();
