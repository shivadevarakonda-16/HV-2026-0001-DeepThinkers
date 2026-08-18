const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    institutionName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    major: {
      type: String,
      default: 'General Studies',
    },
    grade: {
      type: String,
      default: 'First Class with Distinction',
    },
    issueDate: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
      index: true,
    },
    metadataHash: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    localFilePath: {
      type: String,
      default: '',
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    blockIndex: {
      type: Number,
      default: null,
    },
    blockHash: {
      type: String,
      default: '',
    },
    previousBlockHash: {
      type: String,
      default: '',
    },
    chainTxHash: {
      type: String,
      default: null, // Polygon/Sepolia tx hash when USE_REAL_CHAIN is active
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
    revocationReason: {
      type: String,
      default: null,
    },
    revocationDate: {
      type: Date,
      default: null,
    },
    consensusStatus: {
      type: String,
      enum: ['pending', 'dual_verified', 'flagged'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Certificate', CertificateSchema);
