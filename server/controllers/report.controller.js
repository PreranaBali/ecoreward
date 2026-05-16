/**
 * Report Controller – EcoReward
 * Handles garbage report submission, verification, history.
 */

const cloudinary   = require('cloudinary').v2;
const Report       = require('../models/Report');
const User         = require('../models/User');
const fraudService = require('../utils/fraudService');
const rewardEngine = require('../utils/rewardEngine');
const exifService  = require('../utils/exifService');

/* ─── Upload / Submit Report ────────────────────────────────────── */
exports.uploadReport = async (req, res, next) => {
  try {
    const { address, latitude, longitude, city, pincode, binQRCode } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }
    if (!address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Address and coordinates required' });
    }

    /* ── 1. Upload to Cloudinary ──────────────────────────────── */
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder:         'ecoreward/reports',
      transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
    });

    /* ── 2. Fraud / EXIF checks ───────────────────────────────── */
    const imageHash     = fraudService.hashImage(req.file.buffer || req.file.path);
    const isDuplicate   = await Report.isDuplicate(imageHash);
    if (isDuplicate) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
      return res.status(409).json({ success: false, message: 'Duplicate image detected' });
    }

    const exifData      = await exifService.extract(req.file.path);
    const timestampOK   = exifService.validateTimestamp(exifData?.DateTimeOriginal);
    const exifGPSMatch  = exifService.compareGPS(exifData, +latitude, +longitude);

    /* ── 3. AI Verification (placeholder / Roboflow hook) ─────── */
    const aiResult = {
      garbageDetected:  true,   // replace with actual AI call
      aiConfidence:     0.92,
      wasteType:        'mixed',
    };

    /* ── 4. Build verification object ───────────────────────────  */
    const verification = {
      garbageDetected:  aiResult.garbageDetected,
      locationVerified: exifGPSMatch || true,   // fallback: GPS provided by user
      timestampValid:   timestampOK,
      fraudCheckPassed: !isDuplicate,
      aiConfidence:     aiResult.aiConfidence,
      wasteType:        aiResult.wasteType,
    };

    const allPassed = Object.values(verification)
      .filter((v) => typeof v === 'boolean')
      .every(Boolean);

    const verificationStatus = allPassed ? 'verified' : 'pending';

    /* ── 5. Calculate reward ──────────────────────────────────── */
    const user = await User.findById(req.user._id);
    const { base, bonus, total } = rewardEngine.calculate(user, verification);

    /* ── 6. Save report ───────────────────────────────────────── */
    const report = await Report.create({
      userId:            req.user._id,
      address,
      latitude:          +latitude,
      longitude:         +longitude,
      city:              city || '',
      pincode:           pincode || '',
      imageUrl:          uploadResult.secure_url,
      imagePublicId:     uploadResult.public_id,
      imageHash,
      exifTimestamp:     exifData?.DateTimeOriginal || null,
      exifGPSLat:        exifData?.GPSLatitude   || null,
      exifGPSLon:        exifData?.GPSLongitude  || null,
      rewardPoints:      base,
      streakBonus:       bonus,
      totalAwarded:      verificationStatus === 'verified' ? total : 0,
      verificationStatus,
      verification,
      binQRCode:         binQRCode || '',
    });

    /* ── 7. Award points if verified ─────────────────────────── */
    if (verificationStatus === 'verified') {
      await user.addPoints(total);
    }

    res.status(201).json({
      success: true,
      message: verificationStatus === 'verified'
        ? `Report submitted! You earned ${total} points.`
        : 'Report submitted and pending review.',
      data: { report, pointsAwarded: verificationStatus === 'verified' ? total : 0 },
    });
  } catch (err) {
    next(err);
  }
};

/* ─── Get User Report History ────────────────────────────────────── */
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.verificationStatus = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(+limit)
        .select('-imageHash -imagePublicId'),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ─── Get Single Report ──────────────────────────────────────────── */
exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('userId', 'name avatar');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Users can only view their own reports (admins see all)
    if (report.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    res.json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
};

/* ─── Public: Nearby Reports (for map view) ──────────────────────── */
exports.getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km
    const maxDeg = radius / 111;                 // rough degree conversion

    const reports = await Report.find({
      verificationStatus: 'verified',
      latitude:  { $gte: +lat - maxDeg, $lte: +lat + maxDeg },
      longitude: { $gte: +lng - maxDeg, $lte: +lng + maxDeg },
    })
      .select('address latitude longitude verificationStatus createdAt')
      .limit(100);

    res.json({ success: true, data: { reports } });
  } catch (err) {
    next(err);
  }
};
