const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true, index: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  meetingPoint: { type: String, required: true },
  departureAt: { type: Date, required: true, index: true },
  returnAt: { type: Date, default: null },
  description: { type: String, default: '' },
  coverUrl: { type: String, default: '' },
  estimatedCost: { type: Number, default: null, min: 0 },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
}, { timestamps: true });
module.exports = mongoose.model('Trip', schema);
