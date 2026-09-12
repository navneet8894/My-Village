require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startCronJobs } = require('./src/services/cronJobs');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Ensure the unique participation index exists before accepting confirmations.
  await require('./src/models/TripParticipation').init();
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
    startCronJobs();
  });
}).catch((error) => {
  console.error('API startup failed:', error.message);
  process.exitCode = 1;
});
