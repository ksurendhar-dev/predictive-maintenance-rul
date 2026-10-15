const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
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

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/predictive_maintenance';

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully.');

    await seedDatabase();
    startTelemetrySimulator(io);

    server.listen(PORT, () => {
      console.log(`Predictive Maintenance Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    startTelemetrySimulator(io);
    server.listen(PORT, () => {
      console.log(`Predictive Maintenance Server listening (offline fallback) on port ${PORT}`);
    });
  }
};

startServer();
