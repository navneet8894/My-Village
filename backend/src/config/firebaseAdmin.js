const path = require('path');
const fs = require('fs');

let adminApp = null;

function getFirebaseAdmin() {
  if (adminApp) return adminApp;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return null;
    const admin = require('firebase-admin');
    let cred;
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      cred = JSON.parse(trimmed);
    } else {
      const abs = path.isAbsolute(trimmed)
        ? trimmed
        : path.resolve(process.cwd(), trimmed);
      cred = JSON.parse(fs.readFileSync(abs, 'utf8'));
    }
    adminApp = admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(cred) });
    return adminApp;
  } catch (e) {
    console.warn('Firebase Admin not initialized:', e.message);
    return null;
  }
}

module.exports = { getFirebaseAdmin };
