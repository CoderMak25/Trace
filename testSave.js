const mongoose = require('mongoose');
const Event = require('./server/models/Event');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' });

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    let user = await User.findOne();
    if (!user) {
      console.log('No users found. Creating one...');
      user = await User.create({
        firebaseUID: 'test-uid',
        email: 'test@test.com',
        displayName: 'Test User'
      });
    }

    const event = new Event({
      name: 'Test Event ' + Date.now(),
      organizer: 'Me',
      date: new Date(),
      owner: user._id
    });

    await event.save();
    console.log('Event saved successfully!', event.slug);

    process.exit(0);
  } catch (err) {
    console.error('Save failed:', err);
    process.exit(1);
  }
}

test();
