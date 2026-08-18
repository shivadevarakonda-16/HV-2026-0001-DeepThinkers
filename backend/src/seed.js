const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Institution = require('./models/Institution');
const Certificate = require('./models/Certificate');
const VerificationVote = require('./models/VerificationVote');
const AuditLog = require('./models/AuditLog');
const Block = require('./models/Block');
const BlockchainLedger = require('./blockchain/ledger');
const CertificateService = require('./services/certificateService');
const { uploadCertificateFile } = require('./config/cloudinary');

async function seedData() {
  
  await connectDB();

  // Clean existing collections
  console.log('[Seed] Clearing existing collections...');
  await User.deleteMany({});
  await Institution.deleteMany({});
  await Certificate.deleteMany({});
  await VerificationVote.deleteMany({});
  await AuditLog.deleteMany({});
  await Block.deleteMany({});

  const password = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 1. Create Institutions
  console.log('[Seed] Creating Institutions...');
  const stanford = await Institution.create({
    name: 'Stanford University',
    code: 'STAN-001',
    isVerifiedIssuer: true,
    email: 'issuer_stanford@credora.org',
    contactPerson: 'Dr. Elena Vance (Registrar)',
    address: '450 Serra Mall, Stanford, CA 94305',
    publicKey: '0x71C836642F3eAA164E01E49629b30F3415174545',
  });

  const mit = await Institution.create({
    name: 'MIT Polytech',
    code: 'MIT-002',
    isVerifiedIssuer: true,
    email: 'issuer_mit@credora.org',
    contactPerson: 'Prof. Arthur Sterling (Dean)',
    address: '77 Massachusetts Ave, Cambridge, MA 02139',
    publicKey: '0x32A4B889f029C8B56e63283f6087E98715891398',
  });

  // 2. Create Users
  console.log('[Seed] Creating Users (Institutions, Students, Verifiers, Admin)...');
  const institutionUserStanford = await User.create({
    name: 'Stanford University Registrar',
    email: 'issuer_stanford@credora.org',
    passwordHash,
    role: 'institution',
    institutionId: stanford._id,
    institutionName: stanford.name,
    department: 'Office of Academic Records',
  });

  const institutionUserMit = await User.create({
    name: 'MIT Polytech Registrar',
    email: 'issuer_mit@credora.org',
    passwordHash,
    role: 'institution',
    institutionId: mit._id,
    institutionName: mit.name,
    department: 'Credentialing Department',
  });

  const alice = await User.create({
    name: 'Alice Johnson',
    email: 'alice@student.credora.org',
    passwordHash,
    role: 'student',
    studentIdNumber: 'STU-STAN-2024-8841',
  });

  const bob = await User.create({
    name: 'Bob Smith',
    email: 'bob@student.credora.org',
    passwordHash,
    role: 'student',
    studentIdNumber: 'STU-MIT-2024-9102',
  });

  const googleVerifier = await User.create({
    name: 'Sarah Chen',
    email: 'verifier_google@credora.org',
    passwordHash,
    role: 'verifier',
    organizationName: 'Google LLC (HR Talent Acquisition)',
    department: 'University Talent Verification',
  });

  const msftVerifier = await User.create({
    name: 'David Miller',
    email: 'verifier_msft@credora.org',
    passwordHash,
    role: 'verifier',
    organizationName: 'Microsoft Corp (Global Recruitment)',
    department: 'Technical Credential Compliance',
  });

  const adminUser = await User.create({
    name: 'Credora Foundation Admin',
    email: 'admin@credora.org',
    passwordHash,
    role: 'admin',
    department: 'System Architecture',
  });

  // 3. Initialize Genesis Block
  console.log('[Seed] Creating Blockchain Genesis Block...');
  await BlockchainLedger.initLedger();

  // Helper to create and anchor certificates
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const certDataList = [
    {
      certificateId: 'CRED-STAN-2026-001',
      student: alice,
      institution: stanford,
      courseName: 'Bachelor of Science in Computer Science',
      major: 'Distributed Systems & Cryptography',
      grade: 'First Class with Distinction (GPA 3.96/4.0)',
      issueDate: '2026-05-15',
      status: 'active',
      consensusStatus: 'dual_verified',
      votes: [
        {
          verifier: googleVerifier,
          vote: 'confirm',
          comment: 'Verified candidate against Stanford 2026 graduating roster. Fully authentic.',
        },
        {
          verifier: msftVerifier,
          vote: 'confirm',
          comment: 'Official graduation and honors credentials confirmed by Microsoft HR.',
        },
      ],
    },
    {
      certificateId: 'CRED-MIT-2026-002',
      student: bob,
      institution: mit,
      courseName: 'Master of Science in Cybersecurity & Blockchain Technologies',
      major: 'Cryptographic Protocols & Zero-Knowledge Proofs',
      grade: 'High Honors (GPA 3.92/4.0)',
      issueDate: '2026-06-20',
      status: 'active',
      consensusStatus: 'pending', // 1 of 2 confirmations (ready for demo vote)
      votes: [
        {
          verifier: googleVerifier,
          vote: 'confirm',
          comment: 'First verifier sign-off completed by Google Security Hiring Team.',
        },
      ],
    },
    {
      certificateId: 'CRED-STAN-2026-003',
      student: alice,
      institution: stanford,
      courseName: 'Bachelor of Science in Data Science & Artificial Intelligence',
      major: 'Deep Learning & Foundation Models',
      grade: 'Distinction (GPA 3.88/4.0)',
      issueDate: '2026-07-10',
      status: 'active',
      consensusStatus: 'pending', // 0 of 2 confirmations (freshly issued)
      votes: [],
    },
    {
      certificateId: 'CRED-STAN-2026-004',
      student: { name: 'John Doe', email: 'johndoe@alumni.stanford.edu', _id: null },
      institution: stanford,
      courseName: 'Bachelor of Arts in Economics',
      major: 'Quantitative Finance',
      grade: 'Second Class',
      issueDate: '2025-11-12',
      status: 'revoked',
      revocationReason: 'Academic integrity violation: Unauthorized grade modification detected by academic senate.',
      revocationDate: new Date('2026-02-01'),
      consensusStatus: 'pending',
      votes: [],
    },
    {
      certificateId: 'CRED-MIT-2026-005',
      student: bob,
      institution: mit,
      courseName: 'Professional Certificate in Advanced Cloud Architecture',
      major: 'Multi-Cloud Enterprise Systems',
      grade: 'Merit',
      issueDate: '2026-04-18',
      status: 'active',
      consensusStatus: 'flagged',
      votes: [
        {
          verifier: msftVerifier,
          vote: 'confirm',
          comment: 'Curriculum completion confirmed.',
        },
        {
          verifier: googleVerifier,
          vote: 'flag',
          comment: 'Discrepancy in enrollment dates flagged for registrar clarification.',
        },
      ],
    },
  ];

  console.log('[Seed] Generating certificates, PDFs, QR codes, and anchoring to Blockchain Ledger...');

  for (const item of certDataList) {
    const verificationUrl = `${clientUrl}/verify?id=${item.certificateId}`;

    // Generate PDF and QR
    const { buffer, qrDataUrl } = await CertificateService.generateCertificatePDF({
      certificateId: item.certificateId,
      studentName: item.student.name,
      courseName: item.courseName,
      major: item.major,
      grade: item.grade,
      issueDate: item.issueDate,
      institutionName: item.institution.name,
      verificationUrl,
    });

    const fileHash = CertificateService.computeFileHash(buffer);
    const metadataHash = CertificateService.computeMetadataHash({
      certificateId: item.certificateId,
      studentName: item.student.name,
      studentEmail: item.student.email,
      institutionName: item.institution.name,
      courseName: item.courseName,
      grade: item.grade,
      issueDate: item.issueDate,
    });

    // Upload / store file
    const uploadResult = await uploadCertificateFile(buffer, `${item.certificateId}.pdf`);

    // Add block to local blockchain
    const block = await BlockchainLedger.addBlock(
      item.status === 'revoked' ? 'ISSUE_AND_REVOKE_CERTIFICATE' : 'ISSUE_CERTIFICATE',
      {
        certificateId: item.certificateId,
        studentName: item.student.name,
        studentEmail: item.student.email,
        institutionName: item.institution.name,
        courseName: item.courseName,
        major: item.major,
        grade: item.grade,
        issueDate: item.issueDate,
        fileHash,
        metadataHash,
        fileUrl: uploadResult.secure_url,
        isRevoked: item.status === 'revoked',
        revocationReason: item.revocationReason || null,
      },
      `${item.institution.name} Staking Node`
    );

    // If revoked, add a revocation block as well
    if (item.status === 'revoked') {
      await BlockchainLedger.addBlock('REVOKE_CERTIFICATE', {
        certificateId: item.certificateId,
        revocationReason: item.revocationReason,
        revocationDate: item.revocationDate,
        revokedBy: stanford.email,
        isRevoked: true,
      });
    }

    // Save Certificate Document
    const certDoc = await Certificate.create({
      certificateId: item.certificateId,
      studentId: item.student._id,
      studentName: item.student.name,
      studentEmail: item.student.email,
      institutionId: item.institution._id,
      institutionName: item.institution.name,
      courseName: item.courseName,
      major: item.major,
      grade: item.grade,
      issueDate: item.issueDate,
      fileHash,
      metadataHash,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      localFilePath: uploadResult.localFilePath || '',
      qrCodeDataUrl: qrDataUrl || '',
      blockIndex: block.index,
      blockHash: block.hash,
      previousBlockHash: block.previousHash,
      chainTxHash: null,
      status: item.status,
      revocationReason: item.revocationReason || null,
      revocationDate: item.revocationDate || null,
      consensusStatus: item.consensusStatus,
    });

    // Seed Verification Votes
    if (item.votes && item.votes.length > 0) {
      for (const v of item.votes) {
        await VerificationVote.create({
          certificateId: item.certificateId,
          verifierId: v.verifier._id,
          verifierEmail: v.verifier.email,
          verifierName: v.verifier.name,
          verifierOrgName: v.verifier.organizationName,
          vote: v.vote,
          comment: v.comment,
          timestamp: new Date(),
        });

        await AuditLog.create({
          action: 'VERIFIER_VOTE_CAST',
          actorEmail: v.verifier.email,
          actorRole: 'verifier',
          ipAddress: '127.0.0.1',
          certificateId: item.certificateId,
          details: { vote: v.vote, verifierOrgName: v.verifier.organizationName },
          success: true,
        });
      }
    }

    // Audit log for certificate issuance
    await AuditLog.create({
      action: 'ISSUE_CERTIFICATE',
      actorEmail: item.institution.email,
      actorRole: 'institution',
      ipAddress: '127.0.0.1',
      certificateId: item.certificateId,
      details: {
        studentName: item.student.name,
        courseName: item.courseName,
        blockIndex: block.index,
      },
      success: true,
    });

    if (item.status === 'revoked') {
      await AuditLog.create({
        action: 'REVOKE_CERTIFICATE',
        actorEmail: item.institution.email,
        actorRole: 'institution',
        ipAddress: '127.0.0.1',
        certificateId: item.certificateId,
        details: { reason: item.revocationReason },
        success: true,
      });
    }

    console.log(`  ✓ Seeded [${item.certificateId}] — ${item.courseName} (${item.consensusStatus})`);
  }

  console.log('====================================================');
  console.log('✅ Seed Complete! Demo Accounts Ready:');
  console.log('1. Institution (Stanford): issuer_stanford@credora.org | Password123!');
  console.log('2. Institution (MIT):      issuer_mit@credora.org      | Password123!');
  console.log('3. Student (Alice):        alice@student.credora.org   | Password123!');
  console.log('4. Student (Bob):          bob@student.credora.org     | Password123!');
  console.log('5. Verifier (Google HR):   verifier_google@credora.org | Password123!');
  console.log('6. Verifier (MSFT Recruit):verifier_msft@credora.org   | Password123!');
  console.log('7. Admin:                  admin@credora.org           | Password123!');
  console.log('====================================================');

  if (require.main === module) {
    await disconnectDB();
    process.exit(0);
  }
}

if (require.main === module) {
  seedData().catch((err) => {
    console.error('[Seed] Error seeding data:', err);
    process.exit(1);
  });
}

module.exports = { seedData };
