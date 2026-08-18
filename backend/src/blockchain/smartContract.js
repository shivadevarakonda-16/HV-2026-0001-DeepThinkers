const { ethers } = require('ethers');

const CONTRACT_ABI = [
  'function issueCertificate(string _certificateId, string _dataHash, string _fileHash, string _issuerName, string _studentName) external',
  'function revokeCertificate(string _certificateId, string _reason) external',
  'function verifyCertificate(string _certificateId) external view returns (bool exists, string dataHash, string fileHash, address issuer, string issuerName, string studentName, uint256 issueTimestamp, bool isRevoked, string revocationReason)',
  'function getTotalCertificates() external view returns (uint256)',
  'event CertificateIssued(string indexed certificateId, string indexed fileHash, string dataHash, address indexed issuer, string studentName, uint256 timestamp)',
  'event CertificateRevoked(string indexed certificateId, address indexed revokedBy, string reason, uint256 timestamp)',
];

class SmartContractService {
  constructor() {
    this.useRealChain = process.env.USE_REAL_CHAIN === 'true';
    this.rpcUrl = process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';
    this.contractAddress = process.env.CONTRACT_ADDRESS || '';
    this.privateKey = process.env.PRIVATE_KEY || '';

    this.provider = null;
    this.wallet = null;
    this.contract = null;

    this.init();
  }

  init() {
    if (this.useRealChain && this.contractAddress && this.privateKey) {
      try {
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.wallet);
        console.log(`[Smart Contract] Connected to testnet at ${this.contractAddress} via ${this.rpcUrl}`);
      } catch (error) {
        console.warn(`[Smart Contract] Warning: Failed to initialize testnet provider: ${error.message}`);
        this.contract = null;
      }
    } else {
      console.log(`[Smart Contract] Testnet smart contract inactive (USE_REAL_CHAIN=${this.useRealChain}). Operating in MongoDB SHA-256 Ledger mode.`);
    }
  }

  isReady() {
    return this.useRealChain && this.contract !== null;
  }


  async issueOnChain(certificateId, dataHash, fileHash, issuerName, studentName) {
    if (!this.isReady()) {
      return { success: false, mode: 'local_ledger_only', txHash: null };
    }

    try {
      console.log(`[Smart Contract] Sending issueCertificate tx for ${certificateId}...`);
      const tx = await this.contract.issueCertificate(
        certificateId,
        dataHash,
        fileHash,
        issuerName,
        studentName
      );
      const receipt = await tx.wait();
      console.log(`[Smart Contract] Transaction confirmed in block #${receipt.blockNumber}, txHash: ${receipt.hash}`);
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `https://amoy.polygonscan.com/tx/${receipt.hash}`,
      };
    } catch (error) {
      console.error(`[Smart Contract] Issue tx error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        mode: 'fallback_to_local_ledger',
      };
    }
  }


  async revokeOnChain(certificateId, reason) {
    if (!this.isReady()) {
      return { success: false, mode: 'local_ledger_only', txHash: null };
    }

    try {
      console.log(`[Smart Contract] Sending revokeCertificate tx for ${certificateId}...`);
      const tx = await this.contract.revokeCertificate(certificateId, reason);
      const receipt = await tx.wait();
      console.log(`[Smart Contract] Revocation tx confirmed: ${receipt.hash}`);
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error(`[Smart Contract] Revoke tx error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  
  async verifyOnChain(certificateId) {
    if (!this.isReady()) {
      return null;
    }

    try {
      const readOnlyContract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.provider);
      const result = await readOnlyContract.verifyCertificate(certificateId);
      return {
        exists: result[0],
        dataHash: result[1],
        fileHash: result[2],
        issuer: result[3],
        issuerName: result[4],
        studentName: result[5],
        issueTimestamp: Number(result[6]),
        isRevoked: result[7],
        revocationReason: result[8],
      };
    } catch (error) {
      console.warn(`[Smart Contract] verifyOnChain error: ${error.message}`);
      return null;
    }
  }
}

module.exports = new SmartContractService();
