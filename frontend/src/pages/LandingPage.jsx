import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [certIdInput, setCertIdInput] = useState('');
  const navigate = useNavigate();

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (certIdInput.trim()) {
      navigate(`/verify?id=${certIdInput.trim().toUpperCase()}`);
    }
  };

  const sampleCertificates = [
    { id: 'CRED-STAN-2026-001', title: 'B.S. Computer Science (Stanford)', status: '✅ Dual-Verified (2/2)', badgeClass: 'bg-success' },
    { id: 'CRED-MIT-2026-002', title: 'M.S. Cybersecurity (MIT)', status: '⏳ Pending Consensus (1/2)', badgeClass: 'bg-warning text-dark' },
    { id: 'CRED-STAN-2026-003', title: 'B.S. Data Science (Stanford)', status: '⏳ Fresh (0/2)', badgeClass: 'bg-secondary' },
    { id: 'CRED-STAN-2026-004', title: 'B.A. Economics (Stanford)', status: '⛔ Revoked', badgeClass: 'bg-danger' },
    { id: 'CRED-MIT-2026-005', title: 'Adv. Cloud Arch (MIT)', status: '⚠️ Flagged for Review', badgeClass: 'bg-danger' },
  ];

  return (
    <div className="container py-4">
      {/* Hero Card */}
      <div className="card bg-white p-4 p-md-5 mb-4 border">
        <div className="row align-items-center">
          <div className="col-lg-7 mb-4 mb-lg-0">
            <span className="badge bg-primary mb-2">Team DeepThinkers · HV2026-0001</span>
            <h1 className="fw-bold mb-3">
              Credora <span className="text-primary">v2</span>
            </h1>
            <p className="lead text-secondary mb-4">
              Decentralized Academic Certificate & Digital Credential Verification System. Engineered with{' '}
              <strong>SHA-256 cryptographic hashing</strong>, <strong>dual-layer blockchain anchoring</strong>, and{' '}
              <strong>dual-verifier organizational consensus</strong>.
            </p>

            {/* Quick Verification Search */}
            <form onSubmit={handleVerifySubmit} className="mb-3">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control font-monospace"
                  placeholder="Enter Certificate ID (e.g. CRED-STAN-2026-001)"
                  value={certIdInput}
                  onChange={(e) => setCertIdInput(e.target.value)}
                />
                <button className="btn btn-primary px-4 fw-semibold" type="submit">
                  Verify Now
                </button>
              </div>
            </form>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="small text-muted fw-semibold">Quick Test IDs:</span>
              {sampleCertificates.slice(0, 3).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className="btn btn-outline-secondary btn-sm font-monospace"
                  onClick={() => navigate(`/verify?id=${sample.id}`)}
                >
                  {sample.id}
                </button>
              ))}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card bg-light border p-3">
              <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill"></i> 3-Layer Verification Architecture
              </h6>
              <div className="vstack gap-2">
                <div className="p-2 bg-white rounded border small">
                  <strong>1. Cryptographic Hash:</strong> Byte-level SHA-256 comparison for instant tamper detection.
                </div>
                <div className="p-2 bg-white rounded border small">
                  <strong>2. Blockchain Anchoring:</strong> Immutable block hash & previousHash chain in MongoDB + testnet smart contract.
                </div>
                <div className="p-2 bg-white rounded border small">
                  <strong>3. Dual-Verifier Consensus:</strong> Human-in-the-loop 2-of-2 independent confirmation by verified employers.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demo Cards */}
      <h4 className="fw-bold mb-3 text-dark">Explore System Portals & Features</h4>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card h-100 p-3 border">
            <div className="fs-3 text-primary mb-2">
              <i className="bi bi-building"></i>
            </div>
            <h5 className="card-title fw-bold">Institution Portal</h5>
            <p className="card-text text-muted small">
              Accredited universities issue tamper-proof certificates, auto-generate official PDFs with QR codes, upload to Cloudinary, and manage revocations.
            </p>
            <Link to="/institution" className="btn btn-outline-primary btn-sm mt-auto">
              Open Institution Portal
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 p-3 border">
            <div className="fs-3 text-success mb-2">
              <i className="bi bi-check2-circle"></i>
            </div>
            <h5 className="card-title fw-bold">Verifier Portal (NEW)</h5>
            <p className="card-text text-muted small">
              HR teams and background check agencies review pending credentials, cast cryptographic votes, and achieve the 2-of-2 dual-verifier badge.
            </p>
            <Link to="/verifier" className="btn btn-outline-success btn-sm mt-auto">
              Open Verifier Portal
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 p-3 border">
            <div className="fs-3 text-warning mb-2">
              <i className="bi bi-mortarboard"></i>
            </div>
            <h5 className="card-title fw-bold">Student Dashboard</h5>
            <p className="card-text text-muted small">
              Students access their cryptographically anchored diplomas, download verified PDFs, share links, and display QR codes for immediate verification.
            </p>
            <Link to="/student" className="btn btn-outline-secondary btn-sm mt-auto">
              Open Student Portal
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 p-3 border">
            <div className="fs-3 text-info mb-2">
              <i className="bi bi-link-45deg"></i>
            </div>
            <h5 className="card-title fw-bold">Blockchain Explorer</h5>
            <p className="card-text text-muted small">
              Live explorer visualizing the SHA-256 block ledger stored in MongoDB. Run real-time cryptographic chain integrity validations.
            </p>
            <Link to="/explorer" className="btn btn-outline-info btn-sm mt-auto">
              Explore Blockchain
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 p-3 border">
            <div className="fs-3 text-danger mb-2">
              <i className="bi bi-tools"></i>
            </div>
            <h5 className="card-title fw-bold">Tamper Sandbox</h5>
            <p className="card-text text-muted small">
              Interactive simulator for hackathon judges: tamper with grades or student names and watch the cryptographic mismatch alert trigger instantly.
            </p>
            <Link to="/tamper-sandbox" className="btn btn-outline-danger btn-sm mt-auto">
              Open Tamper Sandbox
            </Link>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 p-3 border">
            <div className="fs-3 text-secondary mb-2">
              <i className="bi bi-journal-text"></i>
            </div>
            <h5 className="card-title fw-bold">Audit Trail</h5>
            <p className="card-text text-muted small">
              Transparent, immutable system activity log recording every issuance, verification check, verifier consensus vote, and revocation event.
            </p>
            <Link to="/audit-logs" className="btn btn-outline-secondary btn-sm mt-auto">
              View Audit Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Pre-Seeded Test Matrix */}
      <div className="card border">
        <div className="card-header bg-light">
          <h5 className="mb-0 fs-6 fw-bold">
            <i className="bi bi-clipboard-check me-2 text-primary"></i> Pre-Seeded Sample Test Cases for Judges
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Certificate ID</th>
                  <th>Student & Degree</th>
                  <th>Consensus Status</th>
                  <th>Test Scenario</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sampleCertificates.map((sample) => (
                  <tr key={sample.id}>
                    <td className="font-monospace fw-bold">{sample.id}</td>
                    <td>{sample.title}</td>
                    <td>
                      <span className={`badge ${sample.badgeClass}`}>{sample.status}</span>
                    </td>
                    <td className="small text-muted">
                      {sample.id === 'CRED-STAN-2026-001' && '2 of 2 Confirmations (Google + Microsoft) — Fully Valid'}
                      {sample.id === 'CRED-MIT-2026-002' && '1 of 2 Confirmations (Ready for 2nd verifier vote)'}
                      {sample.id === 'CRED-STAN-2026-003' && '0 of 2 Confirmations (Freshly issued)'}
                      {sample.id === 'CRED-STAN-2026-004' && 'Officially revoked for academic integrity violation'}
                      {sample.id === 'CRED-MIT-2026-005' && '1 Confirmation + 1 Suspicious Flag'}
                    </td>
                    <td>
                      <Link to={`/verify?id=${sample.id}`} className="btn btn-sm btn-primary">
                        Verify
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
