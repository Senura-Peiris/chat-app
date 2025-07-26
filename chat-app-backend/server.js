const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

const app = express();  // Create the express app **before** using it
const server = http.createServer(app); // Create HTTP server for socket.io

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Your frontend origin
    methods: ['GET', 'POST']
  }
});

// User to socket mapping
const connectedUsers = new Map(); // userId => socket.id

// Handle socket connections
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Register user and map userId to socket
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`✅ Registered user: ${userId} with socket: ${socket.id}`);
  });

  // Handle public message (optional legacy)
  socket.on('send-message', (message) => {
    console.log('📩 Message received:', message);
    io.emit('receive-message', message); // broadcast to all
  });

  // Handle invite from user A to user B
  socket.on('send_invite', ({ from, to }) => {
    const toSocketId = connectedUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('receive_invite', { from });
      console.log(`📨 Invite sent from ${from.username} to ${to}`);
    } else {
      console.log(`⚠️ User ${to} not connected`);
    }
  });

  // Handle accept invite
  socket.on('accept_invite', ({ from, to }) => {
    const fromSocketId = connectedUsers.get(from);
    if (fromSocketId) {
      io.to(fromSocketId).emit('invite_accepted', { by: to });
      console.log(`✅ ${to.username} accepted invite from ${from}`);
    }
  });

  // Handle private messages
  socket.on('send-private-message', ({ to, message }) => {
    const toSocketId = connectedUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('receive-private-message', message);
      console.log(`📬 Private message sent from ${message.senderId} to ${to}`);
    } else {
      console.log(`⚠️ User ${to} not connected`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [userId, sockId] of connectedUsers.entries()) {
      if (sockId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`❌ User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// Debug environment variables
console.log("Loaded env keys:", Object.keys(process.env));
console.log("ATLAS_URI:", process.env.ATLAS_URI);

// Connect to MongoDB
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
