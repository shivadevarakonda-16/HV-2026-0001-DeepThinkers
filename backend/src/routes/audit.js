const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with optional filtering by action, actor, or certificate
 * @access  Public / Admin / Institution (can inspect audit trail)
 */
router.get('/', async (req, res, next) => {
  try {
    const { action, certificateId, actorRole, limit = 50, page = 1 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (certificateId) query.certificateId = certificateId.toUpperCase();
    if (actorRole) query.actorRole = actorRole;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
