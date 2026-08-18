const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const VerificationVote = require('../models/VerificationVote');
const { protect, authorize } = require('../middleware/auth');
const { voteLimiter } = require('../middleware/rateLimiter');
const { logAction } = require('../services/auditService');


async function updateCertificateConsensus(certificateId) {
  const votes = await VerificationVote.find({ certificateId });
  const confirmVotes = votes.filter((v) => v.vote === 'confirm');
  const flagVotes = votes.filter((v) => v.vote === 'flag');

  let consensusStatus = 'pending';
  if (flagVotes.length > 0) {
    consensusStatus = 'flagged';
  } else if (confirmVotes.length >= 2) {
    consensusStatus = 'dual_verified';
  }

  await Certificate.findOneAndUpdate({ certificateId }, { consensusStatus });

  return {
    consensusStatus,
    isDualVerified: consensusStatus === 'dual_verified',
    confirmationsCount: confirmVotes.length,
    flagsCount: flagVotes.length,
    totalVotes: votes.length,
    votes,
  };
}

/**
 * @route   POST /api/certificates/:id/vote
 * @desc    Cast or update a human consensus verification vote (Confirm / Flag)
 * @access  Private (Verifier / Admin)
 */
router.post('/:id/vote', protect, authorize('verifier', 'admin'), voteLimiter, async (req, res, next) => {
  try {
    const certId = req.params.id.trim().toUpperCase();
    const { vote, comment = '' } = req.body;

    if (!vote || !['confirm', 'flag'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type. Must be either 'confirm' or 'flag'.",
      });
    }

    const certificate = await Certificate.findOne({ certificateId: certId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: `Certificate '${certId}' not found.` });
    }

    // Business Rule: Institution cannot vote on its own issued certificates
    if (
      req.user.institutionId &&
      certificate.institutionId &&
      req.user.institutionId.toString() === certificate.institutionId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of Interest: An institution cannot cast verification votes on its own issued certificates.',
      });
    }

    // Check if verifier org matches issuer name
    if (
      req.user.organizationName &&
      certificate.institutionName &&
      req.user.organizationName.toLowerCase().includes(certificate.institutionName.toLowerCase())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Conflict of Interest: Verifier organization cannot be identical to the issuing institution.',
      });
    }

    // Upsert vote (1 vote per verifier per certificate)
    const orgName = req.user.organizationName || `${req.user.name} (Independent Verifier)`;

    const verificationVote = await VerificationVote.findOneAndUpdate(
      { certificateId: certId, verifierId: req.user._id },
      {
        certificateId: certId,
        verifierId: req.user._id,
        verifierEmail: req.user.email,
        verifierName: req.user.name,
        verifierOrgName: orgName,
        vote,
        comment: comment.trim(),
        timestamp: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate Consensus Status
    const consensusResult = await updateCertificateConsensus(certId);

    // Audit Log
    await logAction({
      action: 'VERIFIER_VOTE_CAST',
      actorEmail: req.user.email,
      actorRole: req.user.role,
      ipAddress: req.ip,
      certificateId: certId,
      details: {
        vote,
        verifierOrgName: orgName,
        newConsensusStatus: consensusResult.consensusStatus,
        confirmationsCount: consensusResult.confirmationsCount,
        flagsCount: consensusResult.flagsCount,
      },
      success: true,
    });

    res.status(200).json({
      success: true,
      message: `Vote '${vote.toUpperCase()}' recorded successfully.`,
      vote: verificationVote,
      consensus: consensusResult,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/:id/consensus
 * @desc    Get consensus votes and status for a certificate
 * @access  Public
 */
router.get('/:id/consensus', async (req, res, next) => {
  try {
    const certId = req.params.id.trim().toUpperCase();
    const certificate = await Certificate.findOne({ certificateId: certId });
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const consensusData = await updateCertificateConsensus(certId);

    res.status(200).json({
      success: true,
      certificateId: certId,
      ...consensusData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/verifier/pending
 * @desc    Get certificates pending review that this verifier hasn't voted on yet
 * @access  Private (Verifier / Admin)
 */
router.get('/verifier/pending', protect, authorize('verifier', 'admin'), async (req, res, next) => {
  try {
    // Find all certificates where this verifier has already voted
    const votedCerts = await VerificationVote.find({ verifierId: req.user._id }).distinct('certificateId');

    // Find active certificates not yet voted by this verifier
    const pendingCertificates = await Certificate.find({
      certificateId: { $nin: votedCerts },
      status: 'active',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingCertificates.length,
      certificates: pendingCertificates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/verifier/history
 * @desc    Get list of certificates reviewed by the logged-in verifier
 * @access  Private (Verifier / Admin)
 */
router.get('/verifier/history', protect, authorize('verifier', 'admin'), async (req, res, next) => {
  try {
    const votes = await VerificationVote.find({ verifierId: req.user._id }).sort({ updatedAt: -1 });
    const certIds = votes.map((v) => v.certificateId);

    const certificates = await Certificate.find({ certificateId: { $in: certIds } });
    const certMap = {};
    certificates.forEach((c) => {
      certMap[c.certificateId] = c;
    });

    const history = votes.map((v) => ({
      voteId: v._id,
      certificateId: v.certificateId,
      vote: v.vote,
      comment: v.comment,
      votedAt: v.updatedAt || v.timestamp,
      certificate: certMap[v.certificateId] || null,
    }));

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
