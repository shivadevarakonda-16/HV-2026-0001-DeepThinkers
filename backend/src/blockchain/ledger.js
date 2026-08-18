const crypto = require('crypto');
const Block = require('../models/Block');

class BlockchainLedger {
  
  static calculateHash(index, timestamp, previousHash, data, nonce = 0) {
    let cleanData = data;
    if (data && typeof data.toObject === 'function') {
      cleanData = data.toObject();
    }
    const dataString = typeof cleanData === 'string' ? cleanData : JSON.stringify(cleanData);
    return crypto
      .createHash('sha256')
      .update(`${index}${timestamp}${previousHash}${dataString}${nonce}`)
      .digest('hex');
  }

  static async initLedger() {
    try {
      const count = await Block.countDocuments();
      if (count === 0) {
        const genesisTimestamp = 1704067200000; 
        const genesisData = {
          message: 'Credora Genesis Block — DeepThinkers HV2026-0001',
          protocol: 'Credora Dual-Layer Proof Registry v2',
          timestamp: new Date(genesisTimestamp).toISOString(),
        };
        const genesisPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const genesisHash = this.calculateHash(0, genesisTimestamp, genesisPreviousHash, genesisData, 0);

        const genesisBlock = new Block({
          index: 0,
          timestamp: genesisTimestamp,
          action: 'GENESIS',
          data: genesisData,
          previousHash: genesisPreviousHash,
          hash: genesisHash,
          nonce: 0,
          validator: 'Credora Root Genesis Authority',
        });

        await genesisBlock.save();
        console.log('[Blockchain Ledger] Genesis block created in MongoDB.');
      }
    } catch (error) {
      console.error('[Blockchain Ledger] Error initializing ledger:', error.message);
    }
  }


  static async getLatestBlock() {
    const latest = await Block.findOne().sort({ index: -1 });
    if (!latest) {
      await this.initLedger();
      return await Block.findOne().sort({ index: -1 });
    }
    return latest;
  }

  
  static async addBlock(action, data, validator = 'Credora Node 01') {
    await this.initLedger();
    const latestBlock = await this.getLatestBlock();
    const newIndex = latestBlock.index + 1;
    const newTimestamp = Date.now();
    const previousHash = latestBlock.hash;

    let nonce = 0;
    let hash = this.calculateHash(newIndex, newTimestamp, previousHash, data, nonce);

    const newBlock = new Block({
      index: newIndex,
      timestamp: newTimestamp,
      action,
      data,
      previousHash,
      hash,
      nonce,
      validator,
    });

    await newBlock.save();
    console.log(`[Blockchain Ledger] Mined Block #${newIndex} [${hash.substring(0, 16)}...] Action: ${action}`);
    return newBlock;
  }

  static async getChain() {
    await this.initLedger();
    return await Block.find().sort({ index: 1 });
  }

  static async getBlockByIndex(index) {
    return await Block.findOne({ index: Number(index) });
  }

  static async findCertificate(certificateId) {
    return await Block.findOne({
      'data.certificateId': certificateId.toUpperCase(),
    }).sort({ index: -1 });
  }

  static async validateChainIntegrity() {
    await this.initLedger();
    const chain = await Block.find().sort({ index: 1 });
    const errors = [];

    for (let i = 0; i < chain.length; i++) {
      const currentBlock = chain[i];

      if (currentBlock.index !== i) {
        errors.push({
          blockIndex: currentBlock.index,
          error: `Block index out of sequence: expected ${i}, found ${currentBlock.index}`,
        });
      }

      const recalculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.previousHash,
        currentBlock.data,
        currentBlock.nonce
      );

      if (recalculatedHash !== currentBlock.hash) {
        errors.push({
          blockIndex: currentBlock.index,
          error: `Hash mismatch at block #${currentBlock.index}: stored=${currentBlock.hash}, calculated=${recalculatedHash}`,
          storedHash: currentBlock.hash,
          calculatedHash: recalculatedHash,
        });
      }

      if (i > 0) {
        const previousBlock = chain[i - 1];
        if (currentBlock.previousHash !== previousBlock.hash) {
          errors.push({
            blockIndex: currentBlock.index,
            error: `Broken link at block #${currentBlock.index}: previousHash (${currentBlock.previousHash}) != Block #${previousBlock.index} hash (${previousBlock.hash})`,
          });
        }
      } else {
        if (currentBlock.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
          errors.push({
            blockIndex: 0,
            error: 'Genesis block has invalid previousHash',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      totalBlocks: chain.length,
      errors,
      checkedAt: new Date().toISOString(),
    };
  }
}

module.exports = BlockchainLedger;
