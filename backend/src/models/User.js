const mongoose = require('mongoose');

const ROLES = ['user', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    address: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    fcmTokens: [{ type: String }],
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      default: null,
      index: true,
    },
    villageLocation: {
      country: { type: String, default: '' },
      state: { type: String, default: '' },
      district: { type: String, default: '' },
      village: { type: String, default: '' },
      lat: { type: Number },
      lng: { type: Number },
      placeId: { type: String, default: '' },
      label: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
