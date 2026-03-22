require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function cleanupDevfolioDuplicates() {
  await connectDB();
  
  const devfolioEvents = await Event.find({ source: 'devfolio' }).sort({ createdAt: 1 });
  console.log(`Total Devfolio events found: ${devfolioEvents.length}`);
  
  const groups = {};
  devfolioEvents.forEach(e => {
    const key = e.name.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  
  let deletedCount = 0;
  let updatedCount = 0;

  for (const name in groups) {
    const group = groups[name];
    if (group.length > 1) {
      console.log(`Cleaning up duplicates for: ${group[0].name}`);
      const keeper = group[0]; // Keep oldest to preserve bookmarks
      
      // Delete all others
      for (let i = 1; i < group.length; i++) {
        await Event.deleteOne({ _id: group[i]._id });
        deletedCount++;
      }
      
      // We will let the sync job update the keeper later, 
      // but let's make sure it has the new registrationLink format to be extra safe
      // Actually, it's better to just delete THE NEW ONES and then re-run the sync
      // which will now correctly find the old ones if we update them first.
    }
  }

  console.log(`\nCleanup complete: Deleted ${deletedCount} duplicates.`);
  
  // Now, BEFORE re-syncing, let's ensure all remaining Devfolio events have a SLUG 
  // so the sync job can match them.
  // We can derive the slug from the registrationLink for the old ones.
  const remaining = await Event.find({ source: 'devfolio' });
  for (const ev of remaining) {
    if (!ev.slug && ev.registrationLink) {
      const parts = ev.registrationLink.split('/');
      const slug = parts[parts.length - 1];
      if (slug) {
        ev.slug = slug;
        await ev.save();
        updatedCount++;
      }
    }
  }
  
  console.log(`Updated ${updatedCount} events with missing slugs.`);

  mongoose.connection.close();
}

cleanupDevfolioDuplicates();
