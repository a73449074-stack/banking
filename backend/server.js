const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const initializeDemo = require('./utils/initDemo');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banking-app')
.then(async () => {
  console.log('MongoDB connected');
  // Initialize demo data
  await initializeDemo();
})
.catch(err => {
  console.log('MongoDB connection error:', err.message);
  console.log('Note: Make sure MongoDB is running locally or update MONGODB_URI in .env');
});

// Socket.IO connection handling
const connectedUsers = new Map(); // Store connected users and their roles

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication via socket
  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    connectedUsers.set(socket.id, { userId, role });
    
    // Join appropriate room based on role
    if (role === 'admin') {
      socket.join('admins');
    } else {
      socket.join('users');
      socket.join(`user_${userId}`); // Individual user room
    }
    
    console.log(`User ${userId} authenticated as ${role}`);
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Banking API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
