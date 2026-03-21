require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const unstopSync = require('./jobs/unstopSync');

async function purgeAndResync() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected. Purging all existing unstop records to fetch correct dates...');
    const result = await Event.deleteMany({ source: 'unstop' });
    console.log(`Deleted ${result.deletedCount} malformed unstop events.`);
    
    console.log('Triggering fresh Unstop API Sync with the patched Date mapping logic...');
    await unstopSync();
    
    console.log('Sync complete! Dates are perfect.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

purgeAndResync();
