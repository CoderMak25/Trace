# Trace — Event Calendar App

Trace is a MERN stack web application built for college students to discover, track, and share hackathons, workshops, and tech fests. It features a unique hand-drawn aesthetic, personal event tracking, collaborative team schedules, and push notifications for upcoming deadlines.

## Features

- **Unique Hand-drawn UI:** Built with Tailwind CSS v4, featuring doodle-like border radii, sketch animations, and interactive elements.
- **Discover Events:** Browse and search events by category, mode (Online/In-person), and city.
- **Personal Space:** Each user has their own profile and bookmarked/saved events.
- **Team Collaboration:** Create teams, invite friends via 6-character codes, and build a shared team schedule.
- **Community Submissions:** Anyone can submit new events, which admins review via a dedicated admin panel.
- **Offline / Demo Mode:** Explore the full UI without needing a backend server or Firebase credentials by using the "Demo Login" feature.
- **Push Notifications:** Firebase Cloud Messaging (FCM) integration to alert users 3 days before an event registration deadline via background cron jobs.

## Tech Stack

- **Frontend:** React, Vite, React Router, Tailwind CSS v4, Iconify
- **Backend:** Node.js, Express, MongoDB (Mongoose), node-cron
- **Authentication:** Firebase Auth (Google & Email/Password)
- **Notifications:** Firebase Cloud Messaging (FCM)

## Setup Instructions

### 1. Prerequisites
- Node.js installed
- MongoDB URI (local or Atlas)
- Firebase Project (with Auth and Cloud Messaging enabled)

### 2. Environment Variables

**Server (`server/.env`):**
```env
MONGO_URI=mongodb://localhost:27017/trace
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key-with-\n
```

**Client (`client/.env`):**
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=BDka... (From Firebase Web Push Certificates)
VITE_API_BASE_URL=http://localhost:5000
```

*Note: Update `client/src/firebase/firebaseConfig.js` if you want to use the variables directly instead of the placeholder demo strings currently in the code.*

### 3. Installation & Running

**Terminal 1 (Backend):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install
npm run dev
```

## Running the Demo (Without Firebase/MongoDB)

If you don't want to set up Firebase and MongoDB immediately, you can still test the UI:
1. Start the frontend: `cd client && npm run dev`
2. Go to `http://localhost:5173`
3. Click **Get Started** and use the **Demo Login** button.
4. You will instantly be logged in as a simulated Admin with sample events, teams, and submissions ready to explore!
