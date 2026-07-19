const mongoose = require('mongoose');

function buildSlug(country, state, district, name) {
  return [country, state, district, name]
    .map((s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    )
    .filter(Boolean)
    .join('|');
}

const villageSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '', trim: true },
    state: { type: String, required: true, trim: true },
    stateCode: { type: String, default: '', trim: true },
    district: { type: String, required: true, trim: true },
    districtCode: { type: String, default: '', trim: true },
    subDistrict: { type: String, default: '', trim: true },
    subDistrictCode: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    lat: { type: Number },
    lng: { type: Number },
    placeId: { type: String, default: '' },
    formattedAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

villageSchema.statics.buildSlug = buildSlug;

villageSchema.statics.findOrCreate = async function findOrCreate(data) {
  const slug = buildSlug(data.country, data.state, data.district, data.name);
  let village = await this.findOne({ slug });
  if (!village) {
    village = await this.create({ ...data, slug });
  } else if (data.lat != null && data.lng != null) {
    village.lat = data.lat;
    village.lng = data.lng;
    if (data.placeId) village.placeId = data.placeId;
    if (data.formattedAddress) village.formattedAddress = data.formattedAddress;
    await village.save();
  }
  return village;
};

module.exports = mongoose.model('Village', villageSchema);
module.exports.buildSlug = buildSlug;
