<p align="center">
  <img src="client/public/vite.svg" alt="Trace Logo" width="60" />
</p>

<h1 align="center">Trace — Event Calendar Platform</h1>

<p align="center">
  A hand-drawn, full-stack Progressive Web App (PWA) for discovering and tracking <strong>Indian Hackathons, Tech Fests, and Workshops</strong>.<br />
  <strong>Automated GCal Sync</strong> · Team Collaboration · PWA Offline Caching · Push Notifications
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/Vite-8-purple?logo=vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Express-4-green?logo=express" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20FCM-FFCA28?logo=firebase" />
  <img src="https://img.shields.io/badge/PWA-Workbox-5A0FC8?logo=pwa" />
  <img src="https://img.shields.io/badge/Google-Calendar_API-4285F4?logo=google" />
</p>

---

## 📌 Overview

**Trace** is a community-driven web application built for college students to seamlessly discover and track events. By aggregating hackathons and tech fests into a single hand-drawn dashboard, Trace eliminates the friction of missing deadlines. 

The platform operates as a fast, offline-capable **Progressive Web App (PWA)**, featuring personal bookmarking, seamless Google Calendar integration, automated background cleanup tasks, and Firebase Cloud Messaging (FCM) to deliver critical deadline alerts directly to your device.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Hand-Drawn Aesthetic** | Custom UI built with Tailwind CSS v4, featuring doodle-like borders, blobs, and micro-animations for a highly engaging user experience. |
| **Progressive Web App (PWA)** | `vite-plugin-pwa` integration caches core assets locally. Skeleton loaders ensure instant perceived loading even on slow 3G networks. |
| **Centralized Discovery** | Advanced filtering via custom regions (e.g., *Mumbai & Pune Region*), Mode (Online/Hybrid), and Categories (Case Study, Hackathon). |
| **Team Collaboration** | Form teams with friends using a 6-character invite code. Build a shared team schedule and mark events as "Interested" or "Registered". |
| **Google Calendar Sync** | Automated 2-way sync that instantly adds saved events and team schedules directly to your personal Google Calendar. |
| **Automated Background Jobs** | `node-cron` scripts automatically purge expired events from the database and fire deadline push notifications. |
| **Admin Dashboard** | Secure portal for administrators to review and approve community-submitted events before they go live. |
| **Firebase Cloud Messaging** | Seamlessly delivers push notifications to browsers and mobile devices 3 days before an event registration deadline. |

---

## 🏗️ Architecture

The system uses a **Node.js/Express** backend for API routing and background cron jobs, communicating with a **React/Vite PWA** frontend.

```text
┌──────────────────────────────────────────────────────────┐
│                      Frontend (Vite + React PWA)         │
│  Dashboard · Event Details · Team Schedules · Admin UI   │
│             Tailwind CSS v4 · Workbox Service Worker     │
└────────────────────────┬─────────────────────────────────┘
                         │  REST API (port 5173 → 5000)
┌────────────────────────▼─────────────────────────────────┐
│                   Backend (Express + Node.js)            │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ API      │  │ Google Cal   │  │ Background Jobs    │  │
│  │ Routes   │  │ Service      │  │ (node-cron)        │  │
│  │ /events  │  │ OAuth2 Sync  │  │ deadlineNotifier   │  │
│  │ /users   │  │              │  │ expiredCleanup     │  │
│  └──────────┘  └──────────────┘  └────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │  Mongoose ORM
┌────────────────────────▼─────────────────────────────────┐
│                   MongoDB / Firebase                     │
│  Collections: Events, Users, Teams, Submissions          │
│  Firebase: Auth & Cloud Messaging (Push Notifications)   │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component-based interactive UI |
| **Vite 8** | Ultra-fast dev server & production bundler |
| **Tailwind CSS v4** | Utility-first styling with custom blob/tape design tokens |
| **Workbox** | PWA offline caching and Service Worker routing |
| **Iconify** | High-performance SVG icons (Solar icons) |

### Backend & Background Services
| Technology | Purpose |
|---|---|
| **Express 4** | RESTful API framework |
| **MongoDB** | NoSQL Database for flexible event documents |
| **Mongoose** | Object Data Modeling (ODM) |
| **node-cron** | Scheduled task execution (cleanup & notifications) |

### Infrastructure & APIs
| Technology | Purpose |
|---|---|
| **Firebase Auth** | Secure authentication (Google OAuth & Email) |
| **Firebase Cloud Messaging** | Cross-platform push notifications |
| **Google Calendar API** | Event syncing via Google OAuth2 credentials |

---

## 📂 Project Structure

```text
Trace/
├── client/
│   ├── public/                # Static assets (PWA icons, fonts)
│   ├── src/
│   │   ├── components/        # Reusable UI (EventCard, SkeletonEventCard, FilterBar)
│   │   ├── context/           # AuthContext (Handles Firebase & Backend sync)
│   │   ├── firebase/          # FCM and Auth initialization
│   │   ├── hooks/             # Custom React hooks (useEvents)
│   │   ├── pages/             # Route components (Home, TeamDetail, AdminPanel)
│   │   ├── firebase-messaging-sw.js # Merged Firebase + Workbox Service Worker
│   │   └── main.jsx           # Entrypoint & PWA Registration
│   ├── vite.config.js         # Vite configuration (PWA injectManifest)
│   └── package.json
│
├── server/
│   ├── controllers/           # Business logic (eventController, userController)
│   ├── jobs/                  # Background tasks
│   │   ├── deadlineNotifier.js    # Fires FCM notifications
│   │   └── expiredEventCleanup.js # Purges old events from DB & GCal
│   ├── models/                # Mongoose schemas (User, Event, Team)
│   ├── routes/                # Express router definitions
│   ├── services/              # External API integrations (calendarService)
│   ├── index.js               # Server entrypoint (port 5000)
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** URI (local or MongoDB Atlas)
- **Firebase** Project (with Auth & FCM enabled)
- **Google Cloud Console** Project (for Calendar API credentials)

### 1. Clone & Install

```bash
git clone https://github.com/CoderMak25/Trace.git
cd Trace

# Install Backend dependencies
cd server
npm install

# Install Frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

**Backend (`server/.env`):**
```env
MONGO_URI=mongodb://localhost:27017/trace
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

**Frontend (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=BDka... (From Web Push Certificates)
```

### 3. Run the Application

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

Access the frontend at `http://localhost:5173`.

---

## ⚙️ Automated Background Systems

Trace relies on automated background scripts to maintain a clean database and keep users informed:

1. **Expired Event Purge**: Runs daily at midnight and on server startup. Identifies events where `eventEnd` or `registrationDeadline` has passed, and completely removes them from the database, user bookmarks, team schedules, and synced Google Calendars.
2. **Deadline Notifier**: Runs daily at 12:00 PM. Scans the database for events closing in exactly 3 days. It maps these events to users who bookmarked them and dispatches targeted push notifications via Firebase Cloud Messaging.

---

## 📜 Scripts

| Component | Command | Description |
|---|---|---|
| **Frontend** | `npm run dev` | Starts Vite dev server (HMR enabled) |
| **Frontend** | `npm run build` | Compiles React and builds PWA Service Worker |
| **Backend** | `npm run dev` | Starts Express server with Nodemon |

---

## 📄 License

This project is private and proprietary. All rights reserved.

<p align="center">
  Built with ❤️ by <strong>Team Trace</strong>
</p>
