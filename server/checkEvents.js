require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const connectDB = require('./config/db');

async function checkEvents() {
  await connectDB();
  
  console.log('--- Devfolio Sample ---');
  const devfolio = await Event.findOne({ source: 'devfolio' }).lean();
  if (devfolio) {
    console.log({
      name: devfolio.name,
      date: devfolio.date,
      endDate: devfolio.endDate,
      registrationDeadline: devfolio.registrationDeadline,
      registerCount: devfolio.registerCount
    });
  }

  console.log('\n--- Unstop Sample ---');
  const unstop = await Event.findOne({ source: 'unstop' }).lean();
  if (unstop) {
    console.log({
      name: unstop.name,
      date: unstop.date,
      endDate: unstop.endDate,
      registrationDeadline: unstop.registrationDeadline,
      registerCount: unstop.registerCount
    });
  }

  mongoose.connection.close();
}

checkEvents();
