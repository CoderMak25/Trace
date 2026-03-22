require('dotenv').config();
const mongoose = require('mongoose');
const { syncAllDevfolioEvents } = require('./jobs/devfolioSync');
const { syncAllUnstopEvents } = require('./jobs/unstopSync');
const connectDB = require('./config/db');

async function testSync() {
  await connectDB();
  console.log('Connected for full test');
  
  console.log('--- Syncing Unstop ---');
  await syncAllUnstopEvents();
  
  console.log('--- Syncing Devfolio ---');
  await syncAllDevfolioEvents();
  
  mongoose.connection.close();
}

testSync();
