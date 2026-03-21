require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const startDeadlineNotifier = require('./jobs/deadlineNotifier');

const app = express();
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

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
    startDeadlineNotifier();
    require('./services/notificationCron');
  });
}

start();
