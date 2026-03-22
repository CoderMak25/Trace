require('dotenv').config();
const mongoose = require('mongoose');
const { syncAllDevfolioEvents } = require('./jobs/devfolioSync');
const connectDB = require('./config/db');

async function testSync() {
  await connectDB();
  console.log('Connected for test');
  await syncAllDevfolioEvents();
  mongoose.connection.close();
}

testSync();
