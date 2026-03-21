require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

async function fixSlugs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected, fixing slugs aggressively...');
    const events = await Event.find({ source: 'unstop' });
    let count = 0;
    for (const ev of events) {
      const originalSlug = ev.slug || '';
      console.log('Found:', ev.name, '->', originalSlug);
      
      let cleanSlug = ev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      if (ev.registrationLink && ev.registrationLink.includes('unstop.com/')) {
         const parts = ev.registrationLink.split('/');
         cleanSlug = parts[parts.length - 1] || cleanSlug;
      }
      
      ev.slug = cleanSlug;
      await ev.save();
      count++;
    }
    console.log(`Aggressively overwritten ${count} events with fresh slugs.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixSlugs();
