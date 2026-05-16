/**
 * User Model – EcoReward
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const achievementSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  name:        { type: String, required: true },
  description: String,
  icon:        String,
  earnedAt:    { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: 60,
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      match:    [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: 6,
      select:   false,   // never returned by default
    },
    avatar:      { type: String, default: '' },
    phone:       { type: String, default: '' },

    /* ─── Gamification ─── */
    points:      { type: Number, default: 0, min: 0 },
    level:       { type: Number, default: 1 },
    streak:      { type: Number, default: 0 },
    lastActivity:{ type: Date,   default: null },
    achievements:{ type: [achievementSchema], default: [] },

    /* ─── Auth ─── */
    role:        { type: String, enum: ['user', 'admin', 'ngo'], default: 'user' },
    isVerified:  { type: Boolean, default: false },
    otp:         { type: String, select: false },
    otpExpiry:   { type: Date,   select: false },
    resetToken:  { type: String, select: false },
    resetExpiry: { type: Date,   select: false },
  },
  { timestamps: true }
);

/* ─── Hash password before save ─────────────────────────────────── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ─── Instance methods ──────────────────────────────────────────── */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.addPoints = async function (pts) {
  this.points += pts;
  this.level   = computeLevel(this.points);
  this.updateStreak();
  return this.save();
};

userSchema.methods.updateStreak = function () {
  const now  = new Date();
  const last = this.lastActivity;
  if (!last) {
    this.streak = 1;
  } else {
    const diffDays = Math.floor((now - last) / 86_400_000);
    if (diffDays === 1)      this.streak += 1;
    else if (diffDays > 1)   this.streak  = 1;
    // same day → keep streak unchanged
  }
  this.lastActivity = now;
};

/* ─── Statics ───────────────────────────────────────────────────── */
userSchema.statics.getLeaderboard = function (limit = 50) {
  return this.find({ role: 'user' })
    .select('name avatar points level streak')
    .sort({ points: -1 })
    .limit(limit);
};

/* ─── Helpers ───────────────────────────────────────────────────── */
function computeLevel(points) {
  const thresholds = [0, 500, 1500, 3000, 5500, 9000, 14000, 20000, 28000, 38000];
  return thresholds.filter((t) => points >= t).length;
}

module.exports = mongoose.model('User', userSchema);
