const mongoose = require('mongoose');

const officialLocationSchema = new mongoose.Schema({
  type: { type: String, enum: ['state', 'district', 'subdistrict', 'village'], required: true, index: true },
  code: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  stateCode: { type: String, default: '', index: true },
  stateName: { type: String, default: '' },
  districtCode: { type: String, default: '', index: true },
  districtName: { type: String, default: '' },
  subDistrictCode: { type: String, default: '', index: true },
  subDistrictName: { type: String, default: '' },
}, { timestamps: false });

officialLocationSchema.index({ type: 1, code: 1 }, { unique: true });
officialLocationSchema.index({ type: 1, stateCode: 1, name: 1 });
officialLocationSchema.index({ type: 1, districtCode: 1, name: 1 });
officialLocationSchema.index({ type: 1, subDistrictCode: 1, name: 1 });

module.exports = mongoose.model('OfficialLocation', officialLocationSchema);
