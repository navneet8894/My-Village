const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['register', 'login', 'reset'],
    default: 'register',
  },
  expiresAt: { type: Date, required: true },
  registerMeta: {
    name: { type: String },
    phone: { type: String },
    passwordHash: { type: String },
  },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
