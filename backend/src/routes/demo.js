const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const CertificateService = require('../services/certificateService');
const { logAction } = require('../services/auditService');

/**
 * @route   POST /api/demo/tamper
 * @desc    Simulate tampering with certificate metadata or file content for judge demo
 * @access  Public
 */
router.post('/tamper', async (req, res, next) => {
  try {
    const { certificateId, modifiedFields = {}, simulatedFileContent } = req.body;

    if (!certificateId) {
      return res.status(400).json({ success: false, message: 'Please provide certificateId to test tampering.' });
    }

    const originalCert = await Certificate.findOne({ certificateId: certificateId.toUpperCase() });
    if (!originalCert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Merge modified fields
    const tamperedData = {
      certificateId: originalCert.certificateId,
      studentName: modifiedFields.studentName !== undefined ? modifiedFields.studentName : originalCert.studentName,
      studentEmail: modifiedFields.studentEmail !== undefined ? modifiedFields.studentEmail : originalCert.studentEmail,
      institutionName:
        modifiedFields.institutionName !== undefined ? modifiedFields.institutionName : originalCert.institutionName,
      courseName: modifiedFields.courseName !== undefined ? modifiedFields.courseName : originalCert.courseName,
      grade: modifiedFields.grade !== undefined ? modifiedFields.grade : originalCert.grade,
      issueDate: modifiedFields.issueDate !== undefined ? modifiedFields.issueDate : originalCert.issueDate,
    };

    // Calculate new tampered metadata hash
    const tamperedMetadataHash = CertificateService.computeMetadataHash(tamperedData);

    // Calculate new tampered file hash if custom simulated content was provided
    let tamperedFileHash = originalCert.fileHash;
    if (simulatedFileContent) {
      tamperedFileHash = crypto.createHash('sha256').update(simulatedFileContent).digest('hex');
    }

    const isMetadataTampered = tamperedMetadataHash !== originalCert.metadataHash;
    const isFileTampered = tamperedFileHash !== originalCert.fileHash;
    const isTampered = isMetadataTampered || isFileTampered;

    await logAction({
      action: 'TAMPER_SIMULATION',
      certificateId: originalCert.certificateId,
      ipAddress: req.ip,
      details: {
        isTampered,
        modifiedFields,
        originalMetadataHash: originalCert.metadataHash,
        tamperedMetadataHash,
      },
      success: true,
    });

    res.status(200).json({
      success: true,
      originalCertificate: {
        certificateId: originalCert.certificateId,
        studentName: originalCert.studentName,
        courseName: originalCert.courseName,
        grade: originalCert.grade,
        issueDate: originalCert.issueDate,
        storedMetadataHash: originalCert.metadataHash,
        storedFileHash: originalCert.fileHash,
      },
      tamperedPayload: tamperedData,
      recalculatedHashes: {
        metadataHash: tamperedMetadataHash,
        fileHash: tamperedFileHash,
      },
      integrityCheck: {
        metadataMatch: !isMetadataTampered,
        fileMatch: !isFileTampered,
        overallVerdict: isTampered ? 'TAMPERED_HASH_MISMATCH' : 'VERIFIED_AUTHENTIC',
        alertMessage: isTampered
          ? '🚨 SECURITY ALERT: Cryptographic mismatch detected! Recomputed SHA-256 does not match immutable blockchain registry.'
          : '✅ Cryptographic check passed: Provided data matches blockchain anchor perfectly.',
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
