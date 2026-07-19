require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const OfficialLocation = require('../src/models/OfficialLocation');

const text = (value) => String(value ?? '').trim();

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');
  await mongoose.connect(mongoUri);
  const workbook = XLSX.readFile(path.join(__dirname, '..', 'imports', 'Villages.xlsx'), {
    dense: true, cellFormula: false, cellHTML: false, cellStyles: false, cellNF: false, cellText: false,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }).slice(2);
  await OfficialLocation.deleteMany({ type: 'village' });
  for (let i = 0; i < rows.length; i += 5000) {
    const documents = rows.slice(i, i + 5000).filter((r) => r[1] && r[3] && r[5] && r[7] && r[9]).map((r) => ({
      type: 'village', code: text(r[7]), name: text(r[9]), stateCode: text(r[1]),
      stateName: text(r[2]), districtCode: text(r[3]), districtName: text(r[4]),
      subDistrictCode: text(r[5]), subDistrictName: text(r[6]),
    }));
    if (documents.length) await OfficialLocation.insertMany(documents, { ordered: false });
    console.log(`Processed ${Math.min(i + 5000, rows.length)} of ${rows.length} village rows`);
  }
  console.log(`Imported ${await OfficialLocation.countDocuments({ type: 'village' })} villages.`);
  await mongoose.disconnect();
}

run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exit(1); });
