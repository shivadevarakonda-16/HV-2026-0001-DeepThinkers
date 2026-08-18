const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      default: 'TRANSACTION',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previousHash: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      index: true,
    },
    nonce: {
      type: Number,
      default: 0,
    },
    validator: {
      type: String,
      default: 'Credora Consensus Node 01',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Block', BlockSchema);
