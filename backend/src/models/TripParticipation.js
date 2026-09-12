const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additionalFamilyCount: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  active: { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ trip: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('TripParticipation', schema);
