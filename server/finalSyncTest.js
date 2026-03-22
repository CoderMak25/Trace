require('dotenv').config();
const mongoose = require('mongoose');
const { syncAllDevfolioEvents } = require('./jobs/devfolioSync');
const { syncAllUnstopEvents } = require('./jobs/unstopSync');
const connectDB = require('./config/db');

async function test() {
  await connectDB();
  console.log("--- Syncing Unstop ---");
  await syncAllUnstopEvents();
  console.log("--- Syncing Devfolio ---");
  await syncAllDevfolioEvents();
  mongoose.connection.close();
}

test();
