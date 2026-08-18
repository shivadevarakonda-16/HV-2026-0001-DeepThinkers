const express = require('express');
const router = express.Router();
const BlockchainLedger = require('../blockchain/ledger');
const { logAction } = require('../services/auditService');

/**
 * @route   GET /api/blockchain/chain
 * @desc    Get all blocks in the local ledger
 * @access  Public
 */
router.get('/chain', async (req, res, next) => {
  try {
    const chain = await BlockchainLedger.getChain();
    res.status(200).json({
      success: true,
      length: chain.length,
      chain,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/blockchain/block/:index
 * @desc    Get a specific block by index
 * @access  Public
 */
router.get('/block/:index', async (req, res, next) => {
  try {
    const block = await BlockchainLedger.getBlockByIndex(req.params.index);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Block not found.' });
    }
    res.status(200).json({
      success: true,
      block,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/blockchain/validate
 * @desc    Validate cryptographic integrity of the entire blockchain
 * @access  Public
 */
router.get('/validate', async (req, res, next) => {
  try {
    const validationResult = await BlockchainLedger.validateChainIntegrity();

    await logAction({
      action: 'CHAIN_INTEGRITY_CHECK',
      ipAddress: req.ip,
      details: {
        isValid: validationResult.isValid,
        totalBlocks: validationResult.totalBlocks,
        errorCount: validationResult.errors.length,
      },
      success: validationResult.isValid,
    });

    res.status(200).json({
      success: true,
      ...validationResult,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
