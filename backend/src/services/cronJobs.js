const cron = require('node-cron');
const VillageEvent = require('../models/VillageEvent');
const User = require('../models/User');
const {
  saveInAppNotification,
  sendPushToUser,
} = require('./notificationService');

function startCronJobs() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inOneHourFive = new Date(now.getTime() + 65 * 60 * 1000);

      const events = await VillageEvent.find({
        reminderSent: false,
        date: { $gte: inOneHour, $lte: inOneHourFive },
      }).populate('createdBy', 'name');

      for (const ev of events) {
        ev.reminderSent = true;
        await ev.save();

        const title = 'Event reminder';
        const body = `"${ev.title}" starts in about 1 hour at ${ev.place || 'TBD'}.`;
        const users = await User.find({ isBanned: false, villageId: ev.villageId }).select('_id');
        await Promise.all(
          users.map((u) =>
            saveInAppNotification(u._id, title, body, 'reminder', {
              eventId: String(ev._id),
            })
          )
        );
        await Promise.all(users.map((u) =>
          sendPushToUser(u._id, title, body, {
            type: 'reminder', eventId: String(ev._id),
          })
        ));
      }
    } catch (e) {
      console.error('Cron reminder error', e);
    }
  });
  console.log('Cron: event reminders every 5 minutes');
}

module.exports = { startCronJobs };
