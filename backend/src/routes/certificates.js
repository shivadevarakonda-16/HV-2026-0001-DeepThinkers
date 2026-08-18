const express = require('express');
const router = express.Router();
const multer = require('multer');
const Certificate = require('../models/Certificate');
const Institution = require('../models/Institution');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const CertificateService = require('../services/certificateService');
const { uploadCertificateFile } = require('../config/cloudinary');
const BlockchainLedger = require('../blockchain/ledger');
const smartContractService = require('../blockchain/smartContract');
const { logAction } = require('../services/auditService');

// Multer in-memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/webp'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPG, PNG, WebP) are allowed.'));
    }
  },
});

/**
 * @route   POST /api/certificates/issue
 * @desc    Issue a new academic certificate (Form data or uploaded file)
 * @access  Private (Institution / Admin)
 */
router.post('/issue', protect, authorize('institution', 'admin'), upload.single('file'), async (req, res, next) => {
  try {
    const {
      studentName,
      studentEmail,
      courseName,
      major = 'General Studies',
      grade = 'First Class with Distinction',
      issueDate = new Date().toISOString().split('T')[0],
      customCertificateId,
    } = req.body;

    if (!studentName || !studentEmail || !courseName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required certificate details (studentName, studentEmail, courseName).',
      });
    }

  
    let institution = null;
    if (req.user.institutionId) {
      institution = await Institution.findById(req.user.institutionId);
    }
    if (!institution) {
     
      institution = await Institution.findOne({ email: req.user.email });
      if (!institution) {
        institution = new Institution({
          name: req.user.institutionName || req.user.name,
          code: (req.user.name.substring(0, 4) + '-' + Math.floor(100 + Math.random() * 900)).toUpperCase(),
          email: req.user.email,
          contactPerson: req.user.name,
        });
        await institution.save();
      }
    }

    
    const instCodePrefix = institution.code ? institution.code.substring(0, 4) : 'CRED';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const certificateId = (
      customCertificateId || `CRED-${instCodePrefix}-${new Date().getFullYear()}-${randomSuffix}`
    ).toUpperCase();

   
    const existingCert = await Certificate.findOne({ certificateId });
    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: `A certificate with ID '${certificateId}' already exists.`,
      });
    }

   
    const studentUser = await User.findOne({ email: studentEmail.toLowerCase() });

    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientUrl}/verify?id=${certificateId}`;

    let fileBuffer;
    let qrCodeDataUrl = '';
    let filename;

    if (req.file) {
      // User uploaded custom certificate file
      fileBuffer = req.file.buffer;
      filename = `${certificateId}_uploaded_${req.file.originalname}`;
      qrCodeDataUrl = await CertificateService.generateQRCode(verificationUrl);
    } else {
      // Auto-generate professional PDF with embedded QR
      const generated = await CertificateService.generateCertificatePDF({
        certificateId,
        studentName,
        courseName,
        major,
        grade,
        issueDate,
        institutionName: institution.name,
        verificationUrl,
      });
      fileBuffer = generated.buffer;
      qrCodeDataUrl = generated.qrDataUrl;
      filename = `${certificateId}.pdf`;
    }

    // Calculate Cryptographic Hashes
    const fileHash = CertificateService.computeFileHash(fileBuffer);
    const metadataHash = CertificateService.computeMetadataHash({
      certificateId,
      studentName,
      studentEmail: studentEmail.toLowerCase(),
      institutionName: institution.name,
      courseName,
      grade,
      issueDate,
    });

    // Upload to Cloudinary (or local storage fallback)
    const uploadResult = await uploadCertificateFile(fileBuffer, filename);

    // Anchor on Local SHA-256 Blockchain Ledger (MongoDB-persisted)
    const ledgerBlock = await BlockchainLedger.addBlock('ISSUE_CERTIFICATE', {
      certificateId,
      studentName,
      studentEmail: studentEmail.toLowerCase(),
      institutionName: institution.name,
      courseName,
      major,
      grade,
      issueDate,
      fileHash,
      metadataHash,
      fileUrl: uploadResult.secure_url,
      isRevoked: false,
    });

    // If real chain mode is active, issue on public testnet contract
    let chainTxHash = null;
    if (process.env.USE_REAL_CHAIN === 'true') {
      const chainResult = await smartContractService.issueOnChain(
        certificateId,
        metadataHash,
        fileHash,
        institution.name,
        studentName
      );
      if (chainResult.success) {
        chainTxHash = chainResult.txHash;
      }
    }

    // Save Certificate Document
    const certificate = new Certificate({
      certificateId,
      studentId: studentUser ? studentUser._id : null,
      studentName,
      studentEmail: studentEmail.toLowerCase(),
      institutionId: institution._id,
      institutionName: institution.name,
      courseName,
      major,
      grade,
      issueDate,
      fileHash,
      metadataHash,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      localFilePath: uploadResult.localFilePath || '',
      qrCodeDataUrl,
      blockIndex: ledgerBlock.index,
      blockHash: ledgerBlock.hash,
      previousBlockHash: ledgerBlock.previousHash,
      chainTxHash,
      status: 'active',
      consensusStatus: 'pending', 
    });

    await certificate.save();

    // Record Audit Log
    await logAction({
      action: 'ISSUE_CERTIFICATE',
      actorEmail: req.user.email,
      actorRole: req.user.role,
      ipAddress: req.ip,
      certificateId: certificate.certificateId,
      details: {
        studentName,
        courseName,
        fileHash,
        blockIndex: ledgerBlock.index,
        chainTxHash,
      },
      success: true,
    });

    res.status(201).json({
      success: true,
      message: 'Academic Certificate successfully issued and anchored to blockchain ledger.',
      certificate,
      blockchainProof: {
        blockIndex: ledgerBlock.index,
        blockHash: ledgerBlock.hash,
        previousHash: ledgerBlock.previousHash,
        chainTxHash,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/certificates/:id/revoke
 * @desc    Revoke an issued certificate with an official reason
 * @access  Private (Institution / Admin)
 */
router.post('/:id/revoke', protect, authorize('institution', 'admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const certId = req.params.id.toUpperCase();

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide an official reason for revocation.' });
    }

    const certificate = await Certificate.findOne({ certificateId: certId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: `Certificate '${certId}' not found.` });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({ success: false, message: `Certificate '${certId}' is already revoked.` });
    }

    // Ownership check (Institution can only revoke their own, Admin can revoke any)
    if (req.user.role === 'institution' && req.user.institutionId) {
      if (certificate.institutionId.toString() !== req.user.institutionId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized: You can only revoke certificates issued by your institution.',
        });
      }
    }

    certificate.status = 'revoked';
    certificate.revocationReason = reason;
    certificate.revocationDate = new Date();
    await certificate.save();

    // Record Revocation to Blockchain Ledger
    const revokeBlock = await BlockchainLedger.addBlock('REVOKE_CERTIFICATE', {
      certificateId: certificate.certificateId,
      revocationReason: reason,
      revocationDate: certificate.revocationDate,
      revokedBy: req.user.email,
      isRevoked: true,
    });

    // Revoke on Smart Contract if real chain active
    if (process.env.USE_REAL_CHAIN === 'true') {
      await smartContractService.revokeOnChain(certificate.certificateId, reason);
    }

    // Record Audit Log
    await logAction({
      action: 'REVOKE_CERTIFICATE',
      actorEmail: req.user.email,
      actorRole: req.user.role,
      ipAddress: req.ip,
      certificateId: certificate.certificateId,
      details: { reason, revokeBlockIndex: revokeBlock.index },
      success: true,
    });

    res.status(200).json({
      success: true,
      message: `Certificate '${certId}' has been officially revoked and recorded on the blockchain.`,
      certificate,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/mine
 * @desc    Get certificates belonging to the logged-in student
 * @access  Private (Student)
 */
router.get('/mine', protect, authorize('student'), async (req, res, next) => {
  try {
    const certificates = await Certificate.find({
      $or: [{ studentEmail: req.user.email.toLowerCase() }, { studentId: req.user._id }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/institution
 * @desc    Get certificates issued by the logged-in institution
 * @access  Private (Institution)
 */
router.get('/institution', protect, authorize('institution'), async (req, res, next) => {
  try {
    const query = {};
    if (req.user.institutionId) {
      query.institutionId = req.user.institutionId;
    } else {
      query.institutionName = req.user.institutionName || req.user.name;
    }

    const certificates = await Certificate.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/all
 * @desc    Get all certificates with summary info
 * @access  Public / Verifier / Admin
 */
router.get('/all', async (req, res, next) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/:id
 * @desc    Get single certificate by certificateId
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id.toUpperCase() });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }
    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
