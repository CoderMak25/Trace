require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

async function fixLinks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected, fixing broken registration links...');
    const events = await Event.find({ source: 'unstop' });
    let count = 0;
    for (const ev of events) {
      if (ev.registrationLink && ev.registrationLink.includes('https://unstop.com/https://unstop.com/')) {
         ev.registrationLink = ev.registrationLink.replace('https://unstop.com/https://unstop.com/', 'https://unstop.com/');
         await ev.save();
         count++;
      }
    }
    console.log(`Aggressively overwritten ${count} malformed URLs.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixLinks();
