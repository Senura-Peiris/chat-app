const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app); // Create HTTP server for socket.io

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Frontend origin
    methods: ['GET', 'POST']
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('send-message', (message) => {
    console.log('📩 Message received:', message);
    io.emit('receive-message', message); // Broadcast to all clients
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

// Static files (e.g., uploaded images/files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debugging ENV keys
console.log("Loaded env keys:", Object.keys(process.env));
console.log("ATLAS_URI:", process.env.ATLAS_URI);

// MongoDB connection
mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('📦 Collections in the connected database:');
  collections.forEach(col => console.log(` - ${col.name}`));

  const admin = db.admin();
  const result = await admin.listDatabases();
  console.log('🗃️ Databases on this cluster:');
  result.databases.forEach(db => {
    console.log(` - ${db.name}`);
  });
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Start server (HTTP + WebSocket)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
