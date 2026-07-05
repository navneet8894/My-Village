# Village Management System

Monorepo layout:

- **backend** — Express + MongoDB (Mongoose), JWT auth, OTP registration, Cloudinary uploads, FCM helpers, `node-cron` reminders, admin APIs.
- **web** — React (Vite), Tailwind CSS, Redux Toolkit + RTK Query, responsive UI with dark/light mode.
- **mobile** — Expo (React Native) with navigation, maps, and sample screens wired to the same API.

See **DEPLOYMENT.md** for MongoDB Atlas, hosting, env vars, and push notification setup.

Quick start (local):

1. Configure `backend/.env` from `backend/.env.example`.
2. `cd backend && npm install && npm run dev`
3. `cd web && npm install && npm run dev` (optional `web/.env` with `VITE_API_URL` if not using the Vite proxy).
