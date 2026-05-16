/**
 * EcoReward – Main Server Entry Point (Real-Time WebSockets Architecture)
 * Node.js + Express + MongoDB + Socket.io
 */

const express       = require('express');
const http          = require('http'); // Built-in Node module to bridge sockets
const { Server }    = require('socket.io'); // WebSocket server constructor
const mongoose      = require('mongoose');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
require('dotenv').config();

const authRoutes    = require('./routes/auth.routes');
const reportRoutes  = require('./routes/report.routes');
const adminRoutes   = require('./routes/admin.routes');
const rewardRoutes  = require('./routes/reward.routes');
const errorHandler  = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app); // Attach Express onto our standard HTTP server

/* ─── Socket.io Configuration ───────────────────────────────────── */
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

// Middleware pipeline injection: attaches the socket instance to every API request
// This lets your controllers (like report.controller.js) use req.io.emit() smoothly
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Real-Time Socket Connection Handlers
io.on('connection', (socket) => {
  console.log(`✅ [Socket] Active device link initialized: ${socket.id}`);

  // Listens for client initialization to map them to an encrypted private room
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`🔒 [Socket] Direct pipeline open for User Room: user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ [Socket] Device connection severed: ${socket.id}`);
  });
});

/* ─── Security & Middleware ─────────────────────────────────────── */
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

/* ─── Rate Limiting ─────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

/* ─── Routes ────────────────────────────────────────────────────── */
app.use('/api/auth',    authRoutes);
app.use('/api/report',  reportRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/reward',  rewardRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

/* ─── Error Handler ─────────────────────────────────────────────── */
app.use(errorHandler);

/* ─── Database & Server Mainframe Startup ────────────────────────── */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, { dbName: 'ecoreward' })
  .then(() => {
    console.log('✅ MongoDB data schema connected');
    // CRITICAL FIX: listen via 'server', NOT 'app'. If you run app.listen here, sockets will stay dead!
    server.listen(PORT, () => console.log(`🚀 EcoReward system running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = server;