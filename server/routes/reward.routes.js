/**
 * Reward Routes – /api/reward/...
 */
const router = require('express').Router();
const User   = require('../models/User');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

/* ─── Leaderboard ───────────────────────────────────────────────── */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const leaders = await User.getLeaderboard(+limit);
    res.json({ success: true, data: { leaders } });
  } catch (err) {
    next(err);
  }
});

/* ─── My rank ───────────────────────────────────────────────────── */
router.get('/my-rank', protect, async (req, res, next) => {
  try {
    const rank = await User.countDocuments({ points: { $gt: req.user.points }, role: 'user' });
    res.json({ success: true, data: { rank: rank + 1, points: req.user.points } });
  } catch (err) {
    next(err);
  }
});

/* ─── My achievements ───────────────────────────────────────────── */
router.get('/achievements', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('achievements points level streak');
    res.json({ success: true, data: { achievements: user.achievements, stats: { points: user.points, level: user.level, streak: user.streak } } });
  } catch (err) {
    next(err);
  }
});

/* ─── Weekly activity ───────────────────────────────────────────── */
router.get('/weekly-activity', protect, async (req, res, next) => {
  try {
    const seven = new Date();
    seven.setDate(seven.getDate() - 7);

    const agg = await Report.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: seven }, verificationStatus: 'verified' } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 }, points: { $sum: '$totalAwarded' } } },
    ]);

    res.json({ success: true, data: { activity: agg } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
