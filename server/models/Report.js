/**
 * Report Model – EcoReward
 */

const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  garbageDetected:  { type: Boolean, default: false },
  locationVerified: { type: Boolean, default: false },
  timestampValid:   { type: Boolean, default: false },
  fraudCheckPassed: { type: Boolean, default: false },
  aiConfidence:     { type: Number,  default: 0, min: 0, max: 1 },
  wasteType:        { type: String,  default: 'mixed' },  // e.g. recyclable, organic, hazardous
  verifiedAt:       { type: Date },
  verifiedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
}, { _id: false });

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: false,
      index:    true,
    },

    /* ─── Location ─── */
    address:   { type: String, required: true, maxlength: 300 },
    latitude:  { type: Number, required: true, min: -90,  max: 90  },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    city:      { type: String, default: '' },
    pincode:   { type: String, default: '' },

    /* ─── Image ─── */
    imageUrl:        { type: String, required: true },
    imagePublicId:   { type: String, default: '' },   // Cloudinary public_id for deletion
    imageHash:       { type: String, default: '', index: true }, // MD5/SHA for duplicate detection
    exifTimestamp:   { type: Date,   default: null },
    exifGPSLat:      { type: Number, default: null },
    exifGPSLon:      { type: Number, default: null },

    /* ─── Reward ─── */
    rewardPoints:  { type: Number, default: 0 },
    streakBonus:   { type: Number, default: 0 },
    totalAwarded:  { type: Number, default: 0 },

    /* ─── Status ─── */
    verificationStatus: {
      type:    String,
      enum:    ['pending', 'verified', 'rejected', 'flagged'],
      default: 'pending',
      index:   true,
    },
    rejectionReason: { type: String, default: '' },
    verification:    { type: verificationSchema, default: () => ({}) },

    /* ─── QR Bin ─── */
    binQRCode:   { type: String, default: '' },   // scanned bin ID
    binId:       { type: String, default: '' },
  },
  { timestamps: true }
);

/* ─── Indexes ───────────────────────────────────────────────────── */
reportSchema.index({ latitude: 1, longitude: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });

/* ─── Virtual: full location string ─────────────────────────────── */
reportSchema.virtual('coordinates').get(function () {
  return { lat: this.latitude, lng: this.longitude };
});

/* ─── Statics ───────────────────────────────────────────────────── */
reportSchema.statics.isDuplicate = async function (hash) {
  return this.exists({ imageHash: hash, verificationStatus: { $ne: 'rejected' } });
};

reportSchema.statics.getUserStats = async function (userId) {
  const agg = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), verificationStatus: 'verified' } },
    {
      $group: {
        _id:         '$userId',
        totalReports:{ $sum: 1 },
        totalPoints: { $sum: '$totalAwarded' },
        avgPoints:   { $avg: '$totalAwarded' },
        lastReport:  { $max: '$createdAt' },
      },
    },
  ]);
  return agg[0] || { totalReports: 0, totalPoints: 0, avgPoints: 0 };
};

module.exports = mongoose.model('Report', reportSchema);
