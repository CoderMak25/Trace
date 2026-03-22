require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function checkUnstopDates() {
  await connectDB();
  const events = await Event.find({ source: 'unstop' }).limit(10).lean();
  events.forEach(e => {
    console.log(`${e.name} | date: ${e.date} | endDate: ${e.endDate}`);
  });
  mongoose.connection.close();
}

checkUnstopDates();
