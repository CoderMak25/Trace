const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Event = require('../models/Event');

async function fixSlugs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

    const nullSlugEvents = await Event.find({ slug: null });
    console.log(`Found ${nullSlugEvents.length} events with null slugs.`);

    for (const event of nullSlugEvents) {
      const newSlug = slugify(event.name) + '-' + Math.random().toString(36).substring(7);
      event.slug = newSlug;
      await event.save();
      console.log(`Updated event ${event.name} with slug: ${newSlug}`);
    }

    // Also check for duplicate slugs if any
    // (Optional, but findAndModify E11000 is usually because of unique index)

    console.log('Done fixing slugs.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

fixSlugs();
