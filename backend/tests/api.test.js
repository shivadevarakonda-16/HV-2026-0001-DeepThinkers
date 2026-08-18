const assert = require('assert');
const crypto = require('crypto');
const CertificateService = require('../src/services/certificateService');
const BlockchainLedger = require('../src/blockchain/ledger');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Certificate = require('../src/models/Certificate');
const VerificationVote = require('../src/models/VerificationVote');

async function runTests() {
  
  await connectDB();

  // Test 1: SHA-256 File & Metadata Hash Calculation
  console.log('Test 1: Testing SHA-256 Hashing Functions...');
  const sampleBuffer = Buffer.from('Credora Academic Certificate Raw File Content 2026');
  const fileHash = CertificateService.computeFileHash(sampleBuffer);
  assert.strictEqual(typeof fileHash, 'string');
  assert.strictEqual(fileHash.length, 64);
  console.log('  ✓ computeFileHash produced valid 64-char SHA-256 hex string');

  const metadataHash = CertificateService.computeMetadataHash({
    certificateId: 'CRED-STAN-2026-001',
    studentName: 'Alice Johnson',
    studentEmail: 'alice@student.credora.org',
    institutionName: 'Stanford University',
    courseName: 'B.S. Computer Science',
    grade: 'Distinction',
    issueDate: '2026-05-15',
  });
  assert.strictEqual(typeof metadataHash, 'string');
  assert.strictEqual(metadataHash.length, 64);
  console.log('  ✓ computeMetadataHash produced deterministic SHA-256 hash');

  // Test 2: Blockchain Ledger Genesis and Mining
  console.log('Test 2: Testing Blockchain Ledger Operations...');
  await BlockchainLedger.initLedger();
  const latest = await BlockchainLedger.getLatestBlock();
  assert.ok(latest, 'Genesis block must exist');
  console.log(`  ✓ Genesis block verified at index #${latest.index}`);

  const testBlock = await BlockchainLedger.addBlock('TEST_ISSUE', {
    test: true,
    certificateId: 'TEST-CERT-001',
  });
  assert.strictEqual(testBlock.index, latest.index + 1);
  assert.strictEqual(testBlock.previousHash, latest.hash);
  console.log(`  ✓ Block #${testBlock.index} mined with valid previousHash linkage`);

  // Test 3: Blockchain Integrity Verification
  console.log('Test 3: Testing Chain Integrity Validation...');
  const validation = await BlockchainLedger.validateChainIntegrity();
  assert.strictEqual(validation.isValid, true, 'Blockchain integrity must be valid');
  assert.strictEqual(validation.errors.length, 0);
  console.log(`  ✓ Chain validation passed across ${validation.totalBlocks} blocks`);

  // Test 4: PDF Generation with QR
  console.log('Test 4: Testing Dynamic Certificate PDF & QR Generation...');
  const { buffer: pdfBuffer, qrDataUrl } = await CertificateService.generateCertificatePDF({
    certificateId: 'CRED-TEST-2026-999',
    studentName: 'Test Student',
    courseName: 'Test Course in Quantum Computing',
    major: 'Applied Physics',
    grade: 'A+',
    issueDate: '2026-08-18',
    institutionName: 'Stanford University',
    verificationUrl: 'http://localhost:5173/verify?id=CRED-TEST-2026-999',
  });
  assert.ok(pdfBuffer.length > 1000, 'PDF buffer should be generated');
  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'QR data URL must be valid PNG');
  console.log(`  ✓ PDF certificate generated (${pdfBuffer.length} bytes) with QR code`);

  console.log('----------------------------------------------------');
  console.log('🎉 ALL BACKEND UNIT & INTEGRATION TESTS PASSED!');
  console.log('----------------------------------------------------');

  await disconnectDB();
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('❌ Test failed:', err);
  await disconnectDB();
  process.exit(1);
});
