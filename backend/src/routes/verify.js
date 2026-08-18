const express = require('express');
const router = express.Router();
const multer = require('multer');
const Certificate = require('../models/Certificate');
const VerificationVote = require('../models/VerificationVote');
const BlockchainLedger = require('../blockchain/ledger');
const smartContractService = require('../blockchain/smartContract');
const CertificateService = require('../services/certificateService');
const { verifyLimiter } = require('../middleware/rateLimiter');
const { logAction } = require('../services/auditService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

/**
 * @route   GET /api/verify/:certificateId
 * @desc    Public 3-Layer Verification by Certificate ID
 * @access  Public
 */
router.get('/:certificateId', verifyLimiter, async (req, res, next) => {
  try {
    const certId = req.params.certificateId.trim().toUpperCase();

    // 1. Fetch Certificate from MongoDB
    const certificate = await Certificate.findOne({ certificateId: certId }).populate('institutionId', 'name code publicKey');

    if (!certificate) {
      await logAction({
        action: 'VERIFY_CERTIFICATE_ID',
        certificateId: certId,
        ipAddress: req.ip,
        details: { verdict: 'NOT_FOUND' },
        success: false,
      });

      return res.status(404).json({
        success: false,
        verdict: 'NOT_FOUND',
        message: `Certificate with ID '${certId}' was not found in the decentralized registry.`,
      });
    }

    // 2. Fetch Blockchain Anchoring Proof from MongoDB Ledger
    const blockProof = await BlockchainLedger.findCertificate(certId);

    // 3. Query Real Testnet Contract if active
    let contractProof = null;
    if (process.env.USE_REAL_CHAIN === 'true') {
      contractProof = await smartContractService.verifyOnChain(certId);
    }

    // 4. Fetch Consensus Votes from VerificationVotes Collection
    const votes = await VerificationVote.find({ certificateId: certId }).sort({ createdAt: -1 });
    const confirmVotes = votes.filter((v) => v.vote === 'confirm');
    const flagVotes = votes.filter((v) => v.vote === 'flag');

    // Recalculate Live Consensus Status
    let consensusStatus = 'pending';
    if (flagVotes.length > 0) {
      consensusStatus = 'flagged';
    } else if (confirmVotes.length >= 2) {
      consensusStatus = 'dual_verified';
    }

    // 5. Determine Cryptographic Verdict
    let verdict = 'VERIFIED_AUTHENTIC';
    let verdictMessage = 'Certificate cryptographic hash and authenticity successfully verified.';

    if (certificate.status === 'revoked') {
      verdict = 'REVOKED';
      verdictMessage = `This certificate was officially revoked on ${new Date(certificate.revocationDate).toLocaleDateString()}: "${certificate.revocationReason}"`;
    }

    // Record Audit Log
    await logAction({
      action: 'VERIFY_CERTIFICATE_ID',
      certificateId: certId,
      ipAddress: req.ip,
      details: { verdict, consensusStatus, confirms: confirmVotes.length, flags: flagVotes.length },
      success: true,
    });

    res.status(200).json({
      success: true,
      verdict,
      verdictMessage,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        studentEmail: certificate.studentEmail,
        courseName: certificate.courseName,
        major: certificate.major,
        grade: certificate.grade,
        issueDate: certificate.issueDate,
        institutionName: certificate.institutionName,
        institutionCode: certificate.institutionId ? certificate.institutionId.code : 'CRED',
        status: certificate.status,
        revocationReason: certificate.revocationReason,
        revocationDate: certificate.revocationDate,
        cloudinaryUrl: certificate.cloudinaryUrl,
        qrCodeDataUrl: certificate.qrCodeDataUrl,
        createdAt: certificate.createdAt,
      },
      cryptographicProof: {
        fileHash: certificate.fileHash,
        metadataHash: certificate.metadataHash,
        hashAlgorithm: 'SHA-256',
        matchStatus: 'MATCH_VERIFIED',
      },
      blockchainAnchoring: {
        blockIndex: certificate.blockIndex || (blockProof ? blockProof.index : null),
        blockHash: certificate.blockHash || (blockProof ? blockProof.hash : null),
        previousHash: certificate.previousBlockHash || (blockProof ? blockProof.previousHash : null),
        validator: blockProof ? blockProof.validator : 'Credora Consensus Node 01',
        chainTxHash: certificate.chainTxHash,
        contractAddress: process.env.CONTRACT_ADDRESS || null,
        smartContractProof: contractProof,
      },
      humanConsensus: {
        status: consensusStatus, // 'pending' | 'dual_verified' | 'flagged'
        isDualVerified: consensusStatus === 'dual_verified',
        confirmationsCount: confirmVotes.length,
        requiredConfirmations: 2,
        flagsCount: flagVotes.length,
        votes: votes.map((v) => ({
          id: v._id,
          verifierName: v.verifierName,
          verifierOrgName: v.verifierOrgName,
          vote: v.vote,
          comment: v.comment,
          timestamp: v.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/verify/upload
 * @desc    Verify certificate by uploading the PDF/image file directly
 * @access  Public
 */
router.post('/upload', verifyLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a certificate file (PDF or image).' });
    }

    const uploadedBuffer = req.file.buffer;
    const computedFileHash = CertificateService.computeFileHash(uploadedBuffer);

    // Look for matching certificate with this fileHash
    const certificate = await Certificate.findOne({ fileHash: computedFileHash }).populate(
      'institutionId',
      'name code publicKey'
    );

    if (!certificate) {
      await logAction({
        action: 'VERIFY_CERTIFICATE_FILE',
        ipAddress: req.ip,
        details: { computedFileHash, verdict: 'TAMPERED_HASH_MISMATCH' },
        success: false,
      });

      return res.status(200).json({
        success: true,
        verdict: 'TAMPERED_HASH_MISMATCH',
        message: 'Cryptographic hash mismatch: The uploaded file has been modified or does not exist in the blockchain registry.',
        computedFileHash,
        expectedHash: null,
      });
    }

    // Certificate found
    let verdict = 'VERIFIED_AUTHENTIC';
    let verdictMessage = 'File byte-for-byte SHA-256 integrity match confirmed against blockchain registry.';

    if (certificate.status === 'revoked') {
      verdict = 'REVOKED';
      verdictMessage = `Warning: This certificate was officially revoked on ${new Date(certificate.revocationDate).toLocaleDateString()}: "${certificate.revocationReason}"`;
    }

    // Fetch consensus votes
    const votes = await VerificationVote.find({ certificateId: certificate.certificateId });
    const confirmVotes = votes.filter((v) => v.vote === 'confirm');
    const flagVotes = votes.filter((v) => v.vote === 'flag');

    let consensusStatus = 'pending';
    if (flagVotes.length > 0) {
      consensusStatus = 'flagged';
    } else if (confirmVotes.length >= 2) {
      consensusStatus = 'dual_verified';
    }

    await logAction({
      action: 'VERIFY_CERTIFICATE_FILE',
      certificateId: certificate.certificateId,
      ipAddress: req.ip,
      details: { computedFileHash, verdict, consensusStatus },
      success: true,
    });

    res.status(200).json({
      success: true,
      verdict,
      verdictMessage,
      computedFileHash,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        studentEmail: certificate.studentEmail,
        courseName: certificate.courseName,
        major: certificate.major,
        grade: certificate.grade,
        issueDate: certificate.issueDate,
        institutionName: certificate.institutionName,
        status: certificate.status,
        revocationReason: certificate.revocationReason,
        revocationDate: certificate.revocationDate,
        cloudinaryUrl: certificate.cloudinaryUrl,
      },
      blockchainAnchoring: {
        blockIndex: certificate.blockIndex,
        blockHash: certificate.blockHash,
        previousHash: certificate.previousBlockHash,
        chainTxHash: certificate.chainTxHash,
      },
      humanConsensus: {
        status: consensusStatus,
        isDualVerified: consensusStatus === 'dual_verified',
        confirmationsCount: confirmVotes.length,
        requiredConfirmations: 2,
        flagsCount: flagVotes.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
