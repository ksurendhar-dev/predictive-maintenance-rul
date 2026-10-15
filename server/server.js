const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const apiRoutes = require('./routes/api');
const seedDatabase = require('./seed/seedData');
const { startTelemetrySimulator } = require('./services/simulator');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT']
  }
});

app.use(cors());
app.use(express.json());
app.set('io', io);

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Predictive Maintenance & RUL Analytics API',
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});


const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/predictive_maintenance';

let simulatorStarted = false;
const connectDatabase = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log('Connected to MongoDB successfully.');

    await seedDatabase();
    if (!simulatorStarted) {
      startTelemetrySimulator(io);
      simulatorStarted = true;
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Retrying MongoDB connection in 10 seconds...');
    setTimeout(connectDatabase, 10000);
  }
};

const startServer = () => {
  connectDatabase();
  server.listen(PORT, () => {
    console.log(`Predictive Maintenance Server listening on port ${PORT}`);
  });
};

startServer();
