const { getFirebaseAdmin } = require('../config/firebaseAdmin');
const User = require('../models/User');
const Notification = require('../models/Notification');

async function saveInAppNotification(userId, title, body, type, data = {}) {
  return Notification.create({ userId, title, body, type, data });
}

async function sendPushToUser(userId, title, body, data = {}) {
  const user = await User.findById(userId);
  if (!user || !user.fcmTokens?.length) return { skipped: true };

  const admin = getFirebaseAdmin();
  if (!admin) {
    return { skipped: true, reason: 'firebase_not_configured' };
  }

  const messaging = admin.messaging();
  const tokens = [...new Set(user.fcmTokens)].filter(Boolean);
  if (!tokens.length) return { skipped: true };

  const message = {
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
    ),
    tokens,
  };

  try {
    const res = await messaging.sendEachForMulticast(message);
    return { successCount: res.successCount, failureCount: res.failureCount };
  } catch (e) {
    console.error('FCM error', e.message);
    return { error: e.message };
  }
}

async function sendPushToAllUsers(title, body, data = {}, { excludeBanned } = { excludeBanned: true }) {
  const q = excludeBanned ? { isBanned: false } : {};
  const users = await User.find(q).select('fcmTokens');
  const admin = getFirebaseAdmin();
  if (!admin) return { skipped: true, reason: 'firebase_not_configured' };

  const messaging = admin.messaging();
  const tokenSet = new Set();
  users.forEach((u) => (u.fcmTokens || []).forEach((t) => tokenSet.add(t)));
  const tokens = [...tokenSet];
  if (!tokens.length) return { skipped: true, reason: 'no_tokens' };

  const chunkSize = 500;
  let success = 0;
  let failure = 0;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const batch = tokens.slice(i, i + chunkSize);
    const res = await messaging.sendEachForMulticast({
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
      ),
      tokens: batch,
    });
    success += res.successCount;
    failure += res.failureCount;
  }
  return { successCount: success, failureCount: failure };
}

async function notifyUser(userId, title, body, type, data = {}) {
  await saveInAppNotification(userId, title, body, type, data);
  await sendPushToUser(userId, title, body, data);
}

async function notifyAllVillagers(title, body, type, data = {}, villageId = null) {
  const q = { isBanned: false };
  if (villageId) q.villageId = villageId;
  const users = await User.find(q).select('_id fcmTokens');
  await Promise.all(
    users.map((u) => saveInAppNotification(u._id, title, body, type, data))
  );

  const admin = getFirebaseAdmin();
  if (!admin) return;

  const messaging = admin.messaging();
  const tokenSet = new Set();
  users.forEach((u) => (u.fcmTokens || []).forEach((t) => tokenSet.add(t)));
  const tokens = [...tokenSet];
  if (!tokens.length) return;

  const chunkSize = 500;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const batch = tokens.slice(i, i + chunkSize);
    await messaging.sendEachForMulticast({
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries({ type, ...data }).map(([k, v]) => [k, String(v ?? '')])
      ),
      tokens: batch,
    });
  }
}

module.exports = {
  saveInAppNotification,
  sendPushToUser,
  sendPushToAllUsers,
  notifyUser,
  notifyAllVillagers,
};
