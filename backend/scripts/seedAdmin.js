/**
 * Create first admin user (run once after DB is up):
 * node scripts/seedAdmin.js your@email.com YourPassword123 "Admin Name"
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function main() {
  const [, , email, password, name] = process.argv;
  if (!email || !password) {
    console.error('Usage: node scripts/seedAdmin.js email password "Name"');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash(password, 10);
  const doc = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        name: name || 'Administrator',
        email: email.toLowerCase(),
        password: hash,
        role: 'admin',
        isEmailVerified: true,
      },
    },
    { upsert: true, new: true }
  );
  console.log('Admin ready:', doc.email);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
