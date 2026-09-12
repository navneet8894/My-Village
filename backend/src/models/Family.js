const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    displayName: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    phone: { type: String, default: '' },
    occupation: { type: String, default: '' },
    relationshipToHead: { type: String, default: 'member' },
    parentMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isHead: { type: Boolean, default: false },
    // Old "related to" values are not reliable parent/spouse connections.
    relationshipsReviewed: { type: Boolean, default: false },
  },
  { _id: true }
);

const familySchema = new mongoose.Schema(
  {
    name: { type: String, default: 'My Family' },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    headMemberId: { type: mongoose.Schema.Types.ObjectId, default: null },
    members: [memberSchema],
    connections: [{
      _id: false,
      kind: { type: String, enum: ['parent', 'spouse'], required: true },
      fromMemberId: { type: mongoose.Schema.Types.ObjectId, required: true },
      toMemberId: { type: mongoose.Schema.Types.ObjectId, required: true },
    }],
  },
  { timestamps: true, optimisticConcurrency: true }
);

module.exports = mongoose.model('Family', familySchema);
