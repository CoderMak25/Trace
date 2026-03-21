require('dotenv').config();
const mongoose = require('mongoose');

async function clearDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to DB:', mongoose.connection.name);
    
    // Drop the entire database
    await mongoose.connection.dropDatabase();
    console.log('✅ Database dropped successfully! You can now start fresh.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error dropping database:', err);
    process.exit(1);
  }
}

clearDB();
