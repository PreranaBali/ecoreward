/**
 * Admin Controller – EcoReward
 */

const Report = require('../models/Report');
const User   = require('../models/User');
const rewardEngine = require('../utils/rewardEngine');

/* ─── List All Reports ───────────────────────────────────────────── */
exports.listReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;
    if (userId) filter.userId = userId;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(+limit),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { reports, pagination: { page: +page, limit: +limit, total } },
    });
  } catch (err) {
    next(err);
  }
};

/* ─── Verify / Reject a Report ───────────────────────────────────── */
exports.verifyReport = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['verified', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const wasAlreadyVerified = report.verificationStatus === 'verified';

    report.verificationStatus         = status;
    report.rejectionReason            = rejectionReason || '';
    report.verification.verifiedAt    = new Date();
    report.verification.verifiedBy    = req.user._id;

    if (status === 'verified' && !wasAlreadyVerified) {
      const user = await User.findById(report.userId);
      const { total } = rewardEngine.calculate(user, report.verification);
      report.totalAwarded = total;
      await user.addPoints(total);
    }

    if (status === 'rejected' && wasAlreadyVerified && report.totalAwarded > 0) {
      // Claw back points
      const user = await User.findById(report.userId);
      user.points = Math.max(0, user.points - report.totalAwarded);
      await user.save();
      report.totalAwarded = 0;
    }

    await report.save();
    res.json({ success: true, message: `Report marked as ${status}`, data: { report } });
  } catch (err) {
    next(err);
  }
};

/* ─── Delete a Report ───────────────────────────────────────────── */
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    next(err);
  }
};

/* ─── Dashboard Stats ────────────────────────────────────────────── */
exports.getStats = async (req, res, next) => {
  try {
    const [totalReports, verified, pending, users] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ verificationStatus: 'verified' }),
      Report.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ role: 'user' }),
    ]);

    const pointsData = await Report.aggregate([
      { $match: { verificationStatus: 'verified' } },
      { $group: { _id: null, totalPoints: { $sum: '$totalAwarded' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalReports, verified, pending,
        totalUsers:  users,
        totalPoints: pointsData[0]?.totalPoints || 0,
        verificationRate: totalReports ? Math.round((verified / totalReports) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ─── Manage Users ───────────────────────────────────────────────── */
exports.listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ points: -1 })
      .skip((page - 1) * limit)
      .limit(+limit);

    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};
