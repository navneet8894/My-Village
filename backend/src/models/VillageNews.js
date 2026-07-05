const mongoose = require('mongoose');

const villageNewsSchema = new mongoose.Schema(
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
    kind: {
      type: String,
      enum: ['text', 'photo', 'video', 'voice'],
      required: true,
    },
    text: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    isRemoved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VillageNews', villageNewsSchema);
