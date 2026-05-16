# 🌿 EcoReward — AI-Powered Garbage Management System

> Earn reward points for properly disposing garbage. Verified by GPS, AI, and EXIF metadata.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Reward Engine](#reward-engine)
- [Anti-Fraud System](#anti-fraud-system)
- [Deployment](#deployment)
- [Extra Features Roadmap](#extra-features-roadmap)

---

## Overview

EcoReward is a full-stack MERN web application where citizens earn reward points for properly disposing garbage. Every submission is verified using:

- **GPS coordinates** from the browser
- **EXIF metadata** extracted from the uploaded photo (timestamp, GPS, device)
- **AI waste detection** (TensorFlow.js / Roboflow API)
- **Image hashing** to prevent duplicate fraud submissions

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18 (Vite), Tailwind CSS, Framer Motion, Axios, React Router |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB (Mongoose)                              |
| Auth       | JWT (jsonwebtoken + bcryptjs)                   |
| Storage    | Cloudinary (image uploads)                      |
| EXIF       | exifr                                           |
| AI (opt)   | Roboflow API / TensorFlow.js                    |
| Realtime   | Socket.IO (optional, for live point updates)    |

---

## Project Structure

```
ecoreward/
├── client/                     # React Vite frontend
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route-level pages
│       │   ├── Landing.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Upload.jsx
│       │   ├── Leaderboard.jsx
│       │   └── Admin.jsx
│       ├── context/
│       │   └── AuthContext.jsx # Global auth state
│       ├── hooks/
│       │   └── useGPS.js       # Geolocation hook
│       └── services/
│           └── api.js          # Axios service layer
│
└── server/                     # Express backend
    ├── index.js                # Entry point
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── report.controller.js
    │   └── admin.controller.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── report.routes.js
    │   ├── reward.routes.js
    │   └── admin.routes.js
    ├── models/
    │   ├── User.js
    │   └── Report.js
    ├── middleware/
    │   ├── auth.js             # JWT protect / requireAdmin
    │   └── errorHandler.js
    ├── utils/
    │   ├── rewardEngine.js     # Points + achievements
    │   └── fraudService.js     # Hashing, EXIF, GPS
    └── config/
        └── cloudinary.js
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### 1. Clone & Install

```bash
git clone https://github.com/your-org/ecoreward.git
cd ecoreward

# Install backend deps
cd server && npm install

# Install frontend deps
cd ../client && npm install
```

### 2. Configure Environment

```bash
# In /server
cp ../.env.example .env
# Fill in MONGODB_URI, JWT_SECRET, Cloudinary credentials, etc.

# In /client
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 3. Create upload temp directory

```bash
mkdir -p /tmp/ecoreward-uploads
```

### 4. Run Development Servers

```bash
# Terminal 1 – Backend (port 5000)
cd server && npm run dev

# Terminal 2 – Frontend (port 5173)
cd client && npm run dev
```

Visit `http://localhost:5173`

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `CLOUDINARY_*` | Cloudinary credentials |
| `ROBOFLOW_API_KEY` | Optional AI garbage detection |
| `VITE_GOOGLE_MAPS_API_KEY` | For address autocomplete |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/profile` | ✅ | Get current user |
| PATCH | `/api/auth/profile` | ✅ | Update profile |
| POST | `/api/auth/forgot-password` | ❌ | Request password reset |

### Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/report/upload` | ✅ | Submit garbage report |
| GET | `/api/report/history` | ✅ | User's report history |
| GET | `/api/report/nearby?lat=&lng=` | ❌ | Reports near a coordinate |
| GET | `/api/report/:id` | ✅ | Get single report |

### Rewards

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reward/leaderboard` | ❌ | Top 50 users |
| GET | `/api/reward/my-rank` | ✅ | Caller's rank |
| GET | `/api/reward/achievements` | ✅ | Caller's achievements |
| GET | `/api/reward/weekly-activity` | ✅ | Past 7 days activity |

### Admin (role: admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports` | All reports (paginated) |
| PATCH | `/api/admin/verify/:id` | Verify or reject a report |
| DELETE | `/api/admin/report/:id` | Delete a report |
| GET | `/api/admin/stats` | Platform-wide statistics |
| GET | `/api/admin/users` | All users sorted by points |

---

## Database Schema

### User
```js
{
  name, email, password (hashed),
  avatar, phone,
  points, level, streak, lastActivity,
  achievements: [{ id, name, description, icon, earnedAt }],
  role: 'user' | 'admin' | 'ngo',
  isVerified, otp, resetToken
}
```

### Report
```js
{
  userId,
  address, latitude, longitude, city, pincode,
  imageUrl, imagePublicId, imageHash,
  exifTimestamp, exifGPSLat, exifGPSLon,
  rewardPoints, streakBonus, totalAwarded,
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'flagged',
  rejectionReason,
  verification: {
    garbageDetected, locationVerified, timestampValid,
    fraudCheckPassed, aiConfidence, wasteType
  },
  binQRCode, binId,
  createdAt, updatedAt
}
```

---

## Reward Engine

Points are calculated per submission:

| Factor | Points |
|--------|--------|
| Base (any submission) | +100 |
| AI confirms garbage | +30 |
| Location verified | +20 |
| Timestamp valid | +10 |
| Hazardous waste | +50 |
| Recyclable waste | +20 |
| Organic waste | +15 |
| 3-day streak | ×1.10 |
| 7-day streak | ×1.25 |
| 14-day streak | ×1.50 |
| 30-day streak | ×2.00 |

### Level Thresholds

| Level | Points Required |
|-------|----------------|
| 1 | 0 |
| 2 | 500 |
| 3 | 1,500 |
| 4 | 3,000 |
| 5 | 5,500 |
| 6 | 9,000 |
| 7 | 14,000 |
| 8 | 20,000 |
| 9 | 28,000 |
| 10 | 38,000 |

---

## Anti-Fraud System

| Check | Implementation |
|-------|---------------|
| Duplicate images | SHA-256 hash stored on each report; rejected if hash already exists |
| Old photos | EXIF `DateTimeOriginal` must be within 24 hours |
| GPS mismatch | EXIF GPS vs submitted GPS compared via Haversine (max 200 m tolerance) |
| AI verification | Roboflow/TensorFlow confirms garbage is present in frame |

---

## Deployment

### Backend (Railway / Render / Fly.io)

```bash
# Set all .env variables in your hosting dashboard
# Then:
npm start
```

### Frontend (Vercel)

```bash
cd client
npm run build
# Upload /dist to Vercel, or connect GitHub repo
# Set VITE_API_URL to your deployed backend URL
```

### MongoDB Atlas
1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Whitelist your server IP
3. Copy the connection string to `MONGODB_URI`

---

## Extra Features Roadmap

- [ ] **QR Code Bin Scanning** — Citizens scan mounted QR codes on bins; verifies exact disposal point
- [ ] **AI Waste Classification** — Identifies recyclable, organic, hazardous waste type automatically
- [ ] **Municipality Analytics Dashboard** — Heatmaps, disposal trends, ward-level reports
- [ ] **NGO Collaboration** — NGOs can sponsor bonus rewards in their operational zones
- [ ] **Carbon Footprint Tracker** — Each verified report earns CO₂ credits on a personal tracker
- [ ] **Socket.IO Live Updates** — Real-time point notifications and leaderboard changes
- [ ] **Mobile App** — React Native port with offline support

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push and open a PR

---

## License

MIT © EcoReward 2025
