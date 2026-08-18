const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'ISSUE_CERTIFICATE',
        'REVOKE_CERTIFICATE',
        'VERIFY_CERTIFICATE_ID',
        'VERIFY_CERTIFICATE_FILE',
        'VERIFIER_VOTE_CAST',
        'USER_LOGIN',
        'USER_REGISTER',
        'TAMPER_SIMULATION',
        'CHAIN_INTEGRITY_CHECK',
      ],
    },
    actorEmail: {
      type: String,
      default: 'anonymous',
    },
    actorRole: {
      type: String,
      default: 'public',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    certificateId: {
      type: String,
      default: null,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    success: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
