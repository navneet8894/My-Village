# Deployment guide — Village Management System

This monorepo contains three runnable projects: `backend` (Express API), `web` (Vite + React), and `mobile` (Expo).

## 1. MongoDB Atlas

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and allow network access (IP allowlist `0.0.0.0/0` for testing, restrict in production).
3. Copy the connection string into `backend/.env` as `MONGODB_URI`.

## 2. Backend (Node + Express)

**Environment**

- Copy `backend/.env.example` to `backend/.env` and fill:
  - `MONGODB_URI`, `JWT_SECRET`
  - Optional: `SMTP_*` for real OTP emails (without SMTP, OTP is printed to the server console in non-production).
  - `CLOUDINARY_*` for media uploads.
  - `FIREBASE_SERVICE_ACCOUNT` (JSON string or absolute path to the service account file) for FCM push.
  - `GOOGLE_MAPS_API_KEY` for the web map config endpoint (use a **browser-restricted** key).
  - `FRONTEND_URL` for CORS (e.g. your Vercel URL).

**Install and run**

```bash
cd backend
npm install
node scripts/seedAdmin.js admin@example.com YourPassword123 "Admin Name"
npm run dev
```

The API listens on `http://localhost:5000` by default.

**Production hosting**

- Deploy to [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), or a VPS.
- Set the same environment variables in the host dashboard.
- Use `npm start` as the start command and ensure the platform provides a public HTTPS URL for the mobile app and web client.

## 3. Web app (React + Vite)

**Build**

```bash
cd web
npm install
```

Create `web/.env`:

```env
VITE_API_URL=https://your-api.example.com
```

For local dev with Vite proxy, you can leave `VITE_API_URL` empty so requests go to `/api` and the proxy forwards to port 5000.

```bash
npm run dev
```

**Static hosting (e.g. Vercel / Netlify)**

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to your deployed API origin (no trailing slash).

## 4. Mobile (Expo)

**API URL**

- Physical device: use your machine’s LAN IP, e.g. `http://192.168.1.10:5000`, or the deployed API HTTPS URL.
- Android emulator: `http://10.0.2.2:5000` maps to host `localhost`.
- iOS simulator: `http://localhost:5000` often works.

Set `EXPO_PUBLIC_API_URL` or `app.json` → `expo.extra.apiUrl`.

```bash
cd mobile
npm install
npx expo start
```

**Push notifications (FCM)**

1. Create a Firebase project and add Android/iOS apps.
2. Download the **service account** JSON and set `FIREBASE_SERVICE_ACCOUNT` on the backend (or path to the file).
3. In the app, obtain the FCM device token with `expo-notifications` and `POST /api/auth/fcm-token` with the user JWT (extend `HomeScreen` or a dedicated hook when you wire production builds).

**EAS Build (optional)**

- Install EAS CLI, run `eas build`, and configure credentials for store releases.

## 5. Security checklist

- Use strong `JWT_SECRET` and rotate periodically.
- Restrict MongoDB Atlas IPs to your server egress.
- Restrict Google Maps keys by HTTP referrer (web) and package name (Android) / bundle id (iOS).
- Never commit `.env` or Firebase service account files to git.

## 6. Cron reminder

The API runs `node-cron` every **5 minutes** and marks village events with `reminderSent` when the event start time is about **one hour** ahead. Tune the window in `backend/src/services/cronJobs.js` if needed.
