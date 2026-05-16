/**
 * Admin Controller – Manages verification queues and administrative actions
 * Architecture: Node.js + Express + Mongoose + Socket.io (Real-Time Engine)
 */

const Report = require('../models/Report');
const User = require('../models/User');

/**
 * @route   PATCH /api/admin/verify/:id
 * @desc    Approve or reject a user garbage report manually and push updates live
 * @access  Private (Admin Only)
 */
exports.verifyReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // status should be 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status state assignment.' });
    }

    // 1. Fetch the target report document from MongoDB
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Garbage report record identifier not found.' });
    }

    // Prevent modifying reports that are already evaluated
    if (report.verificationStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'This report has already been processed and audited.' });
    }

    // 2. Process Approval vs Rejection Architecture
    if (status === 'rejected') {
      report.verificationStatus = 'rejected';
      report.rejectionReason = rejectionReason || 'Evidence did not meet criteria.';
      await report.save();

      return res.status(200).json({ success: true, message: 'Report rejected successfully.', report });
    }

    // 3. Handle Approval & Reward Issuance Loop
    const pointsAwarded = report.rewardPoints || 150; // Falls back to our standard 150 points assignment

    // Update the report data document
    report.verificationStatus = 'verified';
    await report.save();

    // Find the contributor user and increment their total balance pool instantly
    const targetUser = await User.findByIdAndUpdate(
      report.userId,
      { $inc: { points: pointsAwarded } },
      { new: true } // Returns the newly updated document
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target profile user not found for points issuance.' });
    }

    // 4. ⚡ THE REAL-TIME WEB-SOCKET DISPATCH LINK ⚡
    // Target the specific private user room room we saw initialized in your logs!
    if (req.io) {
      req.io.to(`user_${report.userId}`).emit('reward_issued', {
        message: 'Your report contribution in Karnataka was verified!',
        pointsEarned: pointsAwarded,
        newTotal: targetUser.points,
        reportId: report._id
      });
      console.log(`⚡ [Socket] Live payload dispatched directly to User Room: user_${report.userId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Report verified successfully. Live points pool updated.',
      report
    });

  } catch (error) {
    next(error);
  }
};