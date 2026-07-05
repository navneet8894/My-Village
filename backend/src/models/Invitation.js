const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'card'], default: 'image' },
});

const invitationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    media: [mediaSchema],
    inviteAllVillagers: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
