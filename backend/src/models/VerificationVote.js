const mongoose = require('mongoose');

const VerificationVoteSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    verifierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifierEmail: {
      type: String,
      required: true,
    },
    verifierName: {
      type: String,
      required: true,
    },
    verifierOrgName: {
      type: String,
      required: true,
      trim: true,
    },
    vote: {
      type: String,
      enum: ['confirm', 'flag'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

VerificationVoteSchema.index({ certificateId: 1, verifierId: 1 }, { unique: true });

module.exports = mongoose.model('VerificationVote', VerificationVoteSchema);
