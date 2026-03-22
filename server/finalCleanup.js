require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function finalCleanup() {
  await connectDB();
  
  console.log("Starting final cleanup of Devfolio events...");

  // 1. Group by Name
  const devfolioEvents = await Event.find({ source: 'devfolio' }).sort({ createdAt: 1 });
  const groups = {};
  devfolioEvents.forEach(e => {
    const key = e.name.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  let deleted = 0;
  let updatedCount = 0;

  for (const name in groups) {
    const list = groups[name];
    if (list.length > 1) {
      console.log(`Merging duplicates for: ${list[0].name}`);
      const keeper = list[0];
      // Set the slug for the keeper from its link if missing
      if (!keeper.slug) {
          const parts = keeper.registrationLink.split('/');
          keeper.slug = parts[parts.length - 1];
          await keeper.save();
          updatedCount++;
      }

      // Delete the others
      for (let i = 1; i < list.length; i++) {
        await Event.deleteOne({ _id: list[i]._id });
        deleted++;
      }
    } else {
        // Just one event, make sure it has a slug
        const ev = list[0];
        if (!ev.slug) {
            const parts = ev.registrationLink.split('/');
            ev.slug = parts[parts.length - 1];
            await ev.save();
            updatedCount++;
        }
    }
  }

  console.log(`\nCleanup Done: Deleted ${deleted} duplicates, Updated ${updatedCount} slugs.`);
  mongoose.connection.close();
}

finalCleanup();
