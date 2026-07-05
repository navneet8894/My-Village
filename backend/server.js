require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startCronJobs } = require('./src/services/cronJobs');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
    startCronJobs();
  });
});
