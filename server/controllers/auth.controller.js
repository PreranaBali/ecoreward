/**
 * Auth Controller – EcoReward
 */

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');

/* ─── Helpers ───────────────────────────────────────────────────── */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

/* ─── Register ──────────────────────────────────────────────────── */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/* ─── Login ─────────────────────────────────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/* ─── Get Profile ───────────────────────────────────────────────── */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/* ─── Update Profile ────────────────────────────────────────────── */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'avatar'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/* ─── Forgot Password (placeholder) ─────────────────────────────── */
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    // TODO: send email with resetToken
    res.json({ success: true, message: 'Password reset link sent to email' });
  } catch (err) {
    next(err);
  }
};
