require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncAllUnstopEvents } = require('./jobs/unstopSync');
const { syncAllDevfolioEvents } = require('./jobs/devfolioSync');
const connectDB = require('./config/db');
const startDeadlineNotifier = require('./jobs/deadlineNotifier');

const app = express();
app.set('trust proxy', 1); // Required for express-rate-limit on Render/Vercel
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', globalLimiter); // Apply to all API routes

// Routes
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root URL handler (friendly message instead of 404)
app.get('/', (req, res) => {
  res.send('Trace API is running. Please use /api for endpoints.');
});

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught exception:', error);
});

async function start() {
  await connectDB();
  console.log('Connected to MongoDB'); // Added for clarity after connectDB()
  
  // Auto-sync Unstop events on startup
  try {
    await syncAllUnstopEvents();
    await syncAllDevfolioEvents();
  } catch (err) {
    console.error('Failed to sync events on startup:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
    startDeadlineNotifier();
    require('./services/notificationCron');
  });
}

start();
