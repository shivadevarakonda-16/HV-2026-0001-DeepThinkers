const AuditLog = require('../models/AuditLog');

const logAction = async ({
  action,
  actorEmail = 'anonymous',
  actorRole = 'public',
  ipAddress = '127.0.0.1',
  certificateId = null,
  details = {},
  success = true,
}) => {
  try {
    const log = new AuditLog({
      action,
      actorEmail,
      actorRole,
      ipAddress,
      certificateId,
      details,
      success,
      timestamp: new Date(),
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error.message);
    return null;
  }
};

module.exports = { logAction };
