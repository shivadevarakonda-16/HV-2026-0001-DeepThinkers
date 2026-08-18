const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Institution code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  isVerifiedIssuer: {
    type: Boolean,
    default: true,
  },
  publicKey: {
    type: String,
    default: function () {
      // Generate simulated public key / wallet address
      const crypto = require('crypto');
      return '0x' + crypto.randomBytes(20).toString('hex');
    },
  },
  email: {
    type: String,
    required: true,
  },
  contactPerson: {
    type: String,
    default: 'Registrar Office',
  },
  address: {
    type: String,
    default: 'Main Campus',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Institution', InstitutionSchema);
