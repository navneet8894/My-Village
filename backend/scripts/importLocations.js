require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const OfficialLocation = require('../src/models/OfficialLocation');

const importsDir = path.join(__dirname, '..', 'imports');
const text = (value) => String(value ?? '').trim();

function rows(file) {
  const workbook = XLSX.readFile(path.join(importsDir, file));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }).slice(2);
}

async function insertInBatches(documents, size = 5000) {
  for (let i = 0; i < documents.length; i += size) {
    await OfficialLocation.insertMany(documents.slice(i, i + size), { ordered: false });
  }
}

async function importVillages() {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(path.join(importsDir, 'Villages.xlsx'), {
    sharedStrings: 'cache', hyperlinks: 'ignore', styles: 'ignore', worksheets: 'emit',
  });
  let batch = [];
  let imported = 0;
  for await (const worksheet of reader) {
    for await (const row of worksheet) {
      if (row.number <= 2) continue;
      const r = row.values;
      if (!r[2] || !r[4] || !r[6] || !r[8] || !r[10]) continue;
      batch.push({
        type: 'village', code: text(r[8]), name: text(r[10]), stateCode: text(r[2]),
        stateName: text(r[3]), districtCode: text(r[4]), districtName: text(r[5]),
        subDistrictCode: text(r[6]), subDistrictName: text(r[7]),
      });
      if (batch.length === 5000) {
        await OfficialLocation.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`Imported ${imported} villages...`);
        batch = [];
      }
    }
    break;
  }
  if (batch.length) { await OfficialLocation.insertMany(batch, { ordered: false }); imported += batch.length; }
  return imported;
}

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required');
  await mongoose.connect(mongoUri);
  await OfficialLocation.deleteMany({});

  await insertInBatches(rows('States.xlsx').filter((r) => r[1] && r[3]).map((r) => ({
    type: 'state', code: text(r[1]), name: text(r[3]), stateCode: text(r[1]), stateName: text(r[3]),
  })));
  await insertInBatches(rows('Districts.xlsx').filter((r) => r[1] && r[3] && r[4]).map((r) => ({
    type: 'district', code: text(r[3]), name: text(r[4]), stateCode: text(r[1]), stateName: text(r[2]), districtCode: text(r[3]), districtName: text(r[4]),
  })));
  await insertInBatches(rows('SubDistricts.xlsx').filter((r) => r[1] && r[3] && r[5] && r[7]).map((r) => ({
    type: 'subdistrict', code: text(r[5]), name: text(r[7]), stateCode: text(r[1]), stateName: text(r[2]), districtCode: text(r[3]), districtName: text(r[4]), subDistrictCode: text(r[5]), subDistrictName: text(r[7]),
  })));

  // Villages.xlsx is malformed for strict streaming ZIP readers; the compatible
  // fallback importer is invoked by the npm script after these smaller datasets.
  console.log(`Imported ${await OfficialLocation.countDocuments()} state/district/sub-district records.`);
  await mongoose.disconnect();
}

run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exit(1); });
