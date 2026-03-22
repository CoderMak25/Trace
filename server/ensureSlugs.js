require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function ensureSlugs() {
  await connectDB();
  
  const devfolioEvents = await Event.find({ source: 'devfolio' });
  console.log(`Checking ${devfolioEvents.length} events...`);
  
  let updatedCount = 0;
  for (const ev of devfolioEvents) {
    if (!ev.slug && ev.registrationLink) {
      let slug = '';
      if (ev.registrationLink.includes('.devfolio.co')) {
          // Subdomain format: https://subdomain.devfolio.co
          const match = ev.registrationLink.match(/https:\/\/(.+)\.devfolio\.co/);
          if (match) slug = match[1];
      } else {
          // Generic format: https://devfolio.co/hackathons/slug
          const parts = ev.registrationLink.split('/');
          slug = parts[parts.length - 1];
      }
      
      if (slug) {
        console.log(`Setting slug for ${ev.name}: ${slug}`);
        ev.slug = slug;
        await ev.save();
        updatedCount++;
      }
    }
  }

  console.log(`\nUpdated ${updatedCount} events.`);
  mongoose.connection.close();
}

ensureSlugs();
