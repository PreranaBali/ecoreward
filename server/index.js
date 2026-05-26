/**
 * EcoReward – Main Server Entry Point (Real-Time WebSockets Architecture)
 * Node.js + Express + MongoDB + Socket.io
 */

require('dotenv').config();

const express       = require('express');
const http          = require('http');
const { Server }    = require('socket.io');
const mongoose      = require('mongoose');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const cloudinary    = require('cloudinary').v2;

/* ─── Cloudinary Configuration ─────────────────────────────────── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️ Cloudinary Loaded:', process.env.CLOUDINARY_CLOUD_NAME);

/* ─── Routes & Middleware ──────────────────────────────────────── */
const authRoutes    = require('./routes/auth.routes');
const reportRoutes  = require('./routes/report.routes');
const adminRoutes   = require('./routes/admin.routes');
const rewardRoutes  = require('./routes/reward.routes');
const errorHandler  = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

/* ─── Socket.io Configuration ──────────────────────────────────── */
const io = new Server(server, {
  cors: {
    origin: true, // <-- CHANGE: This dynamically allows any domain
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }
});

/* ─── Inject Socket into Requests ──────────────────────────────── */
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* ─── Real-Time Socket Events ──────────────────────────────────── */
io.on('connection', (socket) => {
  console.log(`✅ [Socket] Active device link initialized: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`🔒 [Socket] Direct pipeline open for User Room: user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ [Socket] Device connection severed: ${socket.id}`);
  });
});

/* ─── Security & Middleware ────────────────────────────────────── */
app.use(helmet());

app.use(cors({
  origin: true, // <-- CHANGE: This dynamically allows any domain
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('dev'));

/* ─── Rate Limiter ─────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api/', limiter);

/* ─── API Routes ───────────────────────────────────────────────── */
app.use('/api/auth',   authRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/reward', rewardRoutes);

/* ─── Health Check ─────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

/* ─── Global Error Handler ─────────────────────────────────────── */
app.use(errorHandler);

/* ─── MongoDB & Server Startup ─────────────────────────────────── */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: 'ecoreward',
  })
  .then(() => {
    console.log('✅ MongoDB data schema connected');

    server.listen(PORT, () => {
      console.log(`🚀 EcoReward system running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = server;
