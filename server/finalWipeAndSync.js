require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const { syncAllDevfolioEvents } = require('./jobs/devfolioSync');
const connectDB = require('./config/db');

async function finalWipeAndSync() {
  try {
    await connectDB();
    console.log("--- Wiping ALL events with devfolio.co links for a fresh start ---");
    const result = await Event.deleteMany({ 
      registrationLink: { $regex: 'devfolio\\.co', $options: 'i' }
    });
    console.log(`Deleted ${result.deletedCount} events with Devfolio links.`);
    
    console.log("--- Starting fresh Devfolio sync ---");
    await syncAllDevfolioEvents();
    
    console.log("--- Cleanup and Sync complete ---");
    mongoose.connection.close();
  } catch (err) {
    console.error("Final Wipe and Sync failed:", err);
    process.exit(1);
  }
}

finalWipeAndSync();
