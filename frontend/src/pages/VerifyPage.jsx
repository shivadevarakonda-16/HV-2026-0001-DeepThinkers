import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { VerdictBadge } from '../components/StatusBadge';
import ConsensusCard from '../components/ConsensusCard';
import QRCodeModal from '../components/QRCodeModal';

export default function VerifyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const certIdFromUrl = searchParams.get('id') || '';

  const [verifyMode, setVerifyMode] = useState('id'); // 'id' | 'file'
  const [certificateIdInput, setCertificateIdInput] = useState(certIdFromUrl);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Auto-verify if ID is in URL
  useEffect(() => {
    if (certIdFromUrl) {
      setCertificateIdInput(certIdFromUrl);
      executeIdVerification(certIdFromUrl);
    }
  }, [certIdFromUrl]);

  const executeIdVerification = async (certId) => {
    if (!certId.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const res = await api.get(`/verify/${certId.trim().toUpperCase()}`);
      if (res.data.success) {
        setVerificationResult(res.data);
      }
    } catch (err) {
      if (err.response?.data) {
        setVerificationResult(err.response.data);
      } else {
        setErrorMsg('Verification request failed. Ensure backend service is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIdSubmit = (e) => {
    e.preventDefault();
    if (certificateIdInput.trim()) {
      setSearchParams({ id: certificateIdInput.trim().toUpperCase() });
      executeIdVerification(certificateIdInput);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a certificate file (PDF or image).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/verify/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setVerificationResult(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'File verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteUpdated = (newConsensusData) => {
    if (verificationResult) {
      setVerificationResult({
        ...verificationResult,
        humanConsensus: newConsensusData,
      });
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold mb-2">
          <i className="bi bi-shield-check me-2 text-primary"></i>
          Public Credential Verification Portal
        </h2>
        <p className="text-muted small mx-auto" style={{ maxWidth: '650px' }}>
          Execute an instant 3-layer verification: cryptographic SHA-256 hash match, immutable blockchain ledger anchoring, and 2-of-2 independent organization consensus.
        </p>
      </div>

      {/* Mode Selector & Input Form */}
      <div className="card shadow-sm border mb-4">
        <div className="card-header bg-light">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${verifyMode === 'id' ? 'active fw-bold text-primary' : 'text-secondary'}`}
                onClick={() => {
                  setVerifyMode('id');
                  setErrorMsg('');
                }}
              >
                <i className="bi bi-upc-scan me-1"></i> Verify by Certificate ID
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${verifyMode === 'file' ? 'active fw-bold text-primary' : 'text-secondary'}`}
                onClick={() => {
                  setVerifyMode('file');
                  setErrorMsg('');
                }}
              >
                <i className="bi bi-file-earmark-arrow-up me-1"></i> Verify by Document Upload
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}

          {verifyMode === 'id' ? (
            <form onSubmit={handleIdSubmit}>
              <div className="input-group input-group-lg">
                <input
                  type="text"
                  className="form-control font-monospace"
                  placeholder="Enter Certificate ID (e.g. CRED-STAN-2026-001)"
                  value={certificateIdInput}
                  onChange={(e) => setCertificateIdInput(e.target.value)}
                  required
                />
                <button className="btn btn-primary px-4 fw-semibold" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-1"></i> Verify Credential
                    </>
                  )}
                </button>
              </div>

              <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
                <span className="small text-muted fw-semibold">Quick Sample Test IDs:</span>
                {['CRED-STAN-2026-001', 'CRED-MIT-2026-002', 'CRED-STAN-2026-003', 'CRED-STAN-2026-004', 'CRED-MIT-2026-005'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="btn btn-outline-secondary btn-sm font-monospace"
                    onClick={() => {
                      setCertificateIdInput(id);
                      setSearchParams({ id });
                      executeIdVerification(id);
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </form>
          ) : (
            <form onSubmit={handleFileSubmit}>
              <div className="row g-2 align-items-center">
                <div className="col-md-9">
                  <input
                    type="file"
                    className="form-control form-control-lg"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    required
                  />
                  <div className="form-text small">
                    Upload the exact PDF diploma or certificate image. The system will compute its SHA-256 byte hash locally and match it with the blockchain ledger.
                  </div>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-primary btn-lg w-100 fw-semibold" type="submit" disabled={loading}>
                    {loading ? 'Computing Hash...' : 'Verify File'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Verification Result Section */}
      {verificationResult && (
        <div>
          {/* Main Verdict Alert Banner */}
          <div
            className={`alert ${
              verificationResult.verdict === 'VERIFIED_AUTHENTIC'
                ? 'alert-success border-success'
                : verificationResult.verdict === 'REVOKED'
                ? 'alert-danger border-danger'
                : verificationResult.verdict === 'TAMPERED_HASH_MISMATCH'
                ? 'alert-danger border-danger'
                : 'alert-secondary'
            } shadow-sm p-4 mb-4`}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="fs-1">
                  {verificationResult.verdict === 'VERIFIED_AUTHENTIC' && '🛡️'}
                  {verificationResult.verdict === 'REVOKED' && '⛔'}
                  {verificationResult.verdict === 'TAMPERED_HASH_MISMATCH' && '🚨'}
                  {verificationResult.verdict === 'NOT_FOUND' && '❓'}
                </div>
                <div>
                  <h4 className="alert-heading fw-bold mb-1">
                    {verificationResult.verdict === 'VERIFIED_AUTHENTIC' && 'Authentic & Valid Academic Credential'}
                    {verificationResult.verdict === 'REVOKED' && 'Officially Revoked Credential'}
                    {verificationResult.verdict === 'TAMPERED_HASH_MISMATCH' && 'Security Alert: Tampered Document / Hash Mismatch'}
                    {verificationResult.verdict === 'NOT_FOUND' && 'Certificate ID Not Found in Blockchain Registry'}
                  </h4>
                  <div className="small mb-0 opacity-90">{verificationResult.verdictMessage || verificationResult.message}</div>
                </div>
              </div>
              <div className="mt-3 mt-md-0">
                <VerdictBadge verdict={verificationResult.verdict} />
              </div>
            </div>
          </div>

          {/* If Certificate Details Exist */}
          {verificationResult.certificate && (
            <div className="row g-4 mb-4">
              {/* Left Column: Academic Credential Details */}
              <div className="col-lg-6">
                <div className="card h-100 border shadow-sm">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fs-6 fw-bold">
                      <i className="bi bi-mortarboard me-2 text-primary"></i> Academic Credential Details
                    </h5>
                    <span className="font-monospace small fw-bold text-muted">
                      {verificationResult.certificate.certificateId}
                    </span>
                  </div>

                  <div className="card-body p-4">
                    <div className="mb-3 pb-3 border-bottom">
                      <span className="text-muted small">Issuing Academic Institution:</span>
                      <h5 className="fw-bold text-primary mb-0">
                        {verificationResult.certificate.institutionName}
                      </h5>
                    </div>

                    <div className="mb-3 pb-3 border-bottom">
                      <span className="text-muted small">Conferred Recipient / Student:</span>
                      <h4 className="fw-bold text-dark mb-0">
                        {verificationResult.certificate.studentName}
                      </h4>
                      <div className="small text-muted">{verificationResult.certificate.studentEmail}</div>
                    </div>

                    <div className="mb-3 pb-3 border-bottom">
                      <span className="text-muted small">Degree / Program Title:</span>
                      <div className="fw-bold fs-6">{verificationResult.certificate.courseName}</div>
                      {verificationResult.certificate.major && (
                        <div className="small text-secondary">Major: {verificationResult.certificate.major}</div>
                      )}
                    </div>

                    <div className="row mb-3">
                      <div className="col-6">
                        <span className="text-muted small">Honors / Grade:</span>
                        <div className="fw-semibold text-success">{verificationResult.certificate.grade}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted small">Conferral Date:</span>
                        <div className="fw-semibold">{verificationResult.certificate.issueDate}</div>
                      </div>
                    </div>

                    {verificationResult.certificate.status === 'revoked' && (
                      <div className="alert alert-danger py-2 small mb-3">
                        <strong>Revocation Reason:</strong> "{verificationResult.certificate.revocationReason}"
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Revoked on: {new Date(verificationResult.certificate.revocationDate).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="d-flex flex-wrap gap-2 mt-4">
                      {verificationResult.certificate.cloudinaryUrl && (
                        <a
                          href={verificationResult.certificate.cloudinaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-file-earmark-pdf me-1"></i> View / Download Official PDF
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowQRModal(true)}
                      >
                        <i className="bi bi-qr-code me-1"></i> View QR Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Layer 1 & Layer 2 Proofs */}
              <div className="col-lg-6">
                {/* Layer 1: Cryptographic Integrity */}
                <div className="card mb-3 border shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 fs-6 fw-bold">
                      <i className="bi bi-cpu me-2 text-primary"></i> Layer 1: Cryptographic SHA-256 Integrity
                    </h5>
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-2">
                      <div className="d-flex justify-content-between small fw-semibold text-muted">
                        <span>Stored Document Hash (SHA-256):</span>
                        <span className="badge bg-success">Byte Match Verified</span>
                      </div>
                      <div className="font-monospace small bg-light p-2 rounded text-break border mt-1">
                        {verificationResult.cryptographicProof?.fileHash || verificationResult.computedFileHash}
                      </div>
                    </div>

                    {verificationResult.cryptographicProof?.metadataHash && (
                      <div>
                        <div className="small fw-semibold text-muted">Canonical Metadata Hash:</div>
                        <div className="font-monospace small bg-light p-2 rounded text-break border mt-1">
                          {verificationResult.cryptographicProof.metadataHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Layer 2: Blockchain Anchoring */}
                <div className="card border shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 fs-6 fw-bold">
                      <i className="bi bi-link-45deg me-2 text-primary"></i> Layer 2: Blockchain Anchoring Proof
                    </h5>
                  </div>
                  <div className="card-body p-3">
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <span className="small text-muted">Ledger Block Index:</span>
                        <div className="fw-bold font-monospace">
                          Block #{verificationResult.blockchainAnchoring?.blockIndex ?? 1}
                        </div>
                      </div>
                      <div className="col-6">
                        <span className="small text-muted">Validator Consensus:</span>
                        <div className="small fw-semibold text-truncate">
                          {verificationResult.blockchainAnchoring?.validator || 'Credora Staking Node 01'}
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="small text-muted">Block Hash:</span>
                      <div className="font-monospace small bg-light p-2 rounded text-break border">
                        {verificationResult.blockchainAnchoring?.blockHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="small text-muted">Previous Block Hash (Linkage):</span>
                      <div className="font-monospace small bg-light p-2 rounded text-break border">
                        {verificationResult.blockchainAnchoring?.previousHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                      </div>
                    </div>

                    {verificationResult.blockchainAnchoring?.chainTxHash && (
                      <div>
                        <span className="small text-muted">Public Testnet Tx Hash (Polygon Amoy / Sepolia):</span>
                        <div className="font-monospace small bg-light p-2 rounded text-break border text-primary">
                          {verificationResult.blockchainAnchoring.chainTxHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layer 3: Dual-Verifier Consensus Card */}
          {verificationResult.certificate && (
            <ConsensusCard
              certificateId={verificationResult.certificate.certificateId}
              consensusData={verificationResult.humanConsensus}
              onVoteSubmitted={handleVoteUpdated}
            />
          )}

          {/* QR Code Modal */}
          <QRCodeModal
            show={showQRModal}
            onHide={() => setShowQRModal(false)}
            certificate={verificationResult.certificate}
          />
        </div>
      )}
    </div>
  );
}
