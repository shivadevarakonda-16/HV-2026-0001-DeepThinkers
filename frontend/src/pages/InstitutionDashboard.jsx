import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ConsensusBadge, CertificateStatusBadge } from '../components/StatusBadge';
import QRCodeModal from '../components/QRCodeModal';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('issue'); // 'issue' | 'list'
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [courseName, setCourseName] = useState('');
  const [major, setMajor] = useState('Distributed Systems & Cryptography');
  const [grade, setGrade] = useState('First Class with Distinction');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCertificateId, setCustomCertificateId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  // Results & Modals
  const [issuedResult, setIssuedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [revokeModalCert, setRevokeModalCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [selectedQRModalCert, setSelectedQRModalCert] = useState(null);

  const fetchCertificates = async () => {
    setFetchingList(true);
    try {
      const res = await api.get('/certificates/institution');
      if (res.data.success) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIssuedResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('studentName', studentName);
      formData.append('studentEmail', studentEmail);
      formData.append('courseName', courseName);
      formData.append('major', major);
      formData.append('grade', grade);
      formData.append('issueDate', issueDate);
      if (customCertificateId.trim()) {
        formData.append('customCertificateId', customCertificateId.trim().toUpperCase());
      }
      if (uploadFile) {
        formData.append('file', uploadFile);
      }

      const res = await api.post('/certificates/issue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setIssuedResult(res.data);
        // Reset form
        setStudentName('');
        setStudentEmail('');
        setCourseName('');
        setCustomCertificateId('');
        setUploadFile(null);
        fetchCertificates();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to issue certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSubmit = async (e) => {
    e.preventDefault();
    if (!revokeModalCert || !revokeReason.trim()) return;

    setRevoking(true);
    try {
      const res = await api.post(`/certificates/${revokeModalCert.certificateId}/revoke`, {
        reason: revokeReason,
      });

      if (res.data.success) {
        setRevokeModalCert(null);
        setRevokeReason('');
        fetchCertificates();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke certificate.');
    } finally {
      setRevoking(false);
    }
  };

  const totalIssued = certificates.length;
  const totalActive = certificates.filter((c) => c.status === 'active').length;
  const totalRevoked = certificates.filter((c) => c.status === 'revoked').length;
  const totalDualVerified = certificates.filter((c) => c.consensusStatus === 'dual_verified').length;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-building me-2 text-primary"></i>
            {user?.institutionName || user?.name} Portal
          </h2>
          <div className="text-muted small">
            Accredited Issuer Registry · Official Blockchain & Cloudinary Credential Gateway
          </div>
        </div>
        <div className="mt-2 mt-md-0">
          <span className="badge bg-primary fs-6 py-2 px-3">
            <i className="bi bi-patch-check-fill me-1"></i> Verified Issuing Authority
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">TOTAL CREDENTIALS</div>
            <div className="fs-3 fw-bold text-dark">{totalIssued}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">ACTIVE & VALID</div>
            <div className="fs-3 fw-bold text-success">{totalActive}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">DUAL-VERIFIED</div>
            <div className="fs-3 fw-bold text-primary">{totalDualVerified}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">OFFICIALLY REVOKED</div>
            <div className="fs-3 fw-bold text-danger">{totalRevoked}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'issue' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            <i className="bi bi-plus-circle me-1"></i> Issue New Credential
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'list' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <i className="bi bi-list-check me-1"></i> Issued Certificates ({totalIssued})
          </button>
        </li>
      </ul>

      {/* Tab 1: Issue Form */}
      {activeTab === 'issue' && (
        <div className="row">
          <div className="col-lg-7">
            <div className="card border shadow-sm mb-4">
              <div className="card-header bg-light py-3">
                <h5 className="card-title mb-0 fs-6 fw-bold">
                  <i className="bi bi-file-earmark-plus me-2 text-primary"></i>
                  Certificate Issuance Form
                </h5>
              </div>
              <div className="card-body p-4">
                {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}

                <form onSubmit={handleIssueSubmit}>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Student Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Alice Johnson"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Student Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="alice@student.credora.org"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Degree / Certification Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bachelor of Science in Computer Science"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Major / Specialization</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Distributed Systems"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Honors / Grade</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. First Class with Distinction"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Conferral Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Custom Certificate ID (Optional)</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="Auto-generated if left blank"
                        value={customCertificateId}
                        onChange={(e) => setCustomCertificateId(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Optional File Upload */}
                  <div className="mb-4 p-3 bg-light border rounded">
                    <label className="form-label small fw-semibold mb-1">
                      Upload Custom Certificate Document (Optional PDF / Image)
                    </label>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                    />
                    <div className="form-text small">
                      If left blank, Credora will auto-generate an official high-resolution PDF certificate with embedded verification QR code and university seal.
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Hashing, Anchoring on Blockchain & Generating PDF...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check me-1"></i> Issue & Anchor Credential on Blockchain
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Issue Result Side Card */}
          <div className="col-lg-5">
            {issuedResult ? (
              <div className="card border-success shadow-sm mb-4">
                <div className="card-header bg-success text-white py-2">
                  <h6 className="card-title mb-0 fs-6 fw-bold">
                    <i className="bi bi-check-circle-fill me-2"></i> Credential Successfully Issued!
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <span className="text-muted small">Certificate ID:</span>
                    <div className="font-monospace fw-bold fs-6 text-primary">
                      {issuedResult.certificate.certificateId}
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-muted small">Recipient:</span>
                    <div className="fw-semibold">
                      {issuedResult.certificate.studentName} ({issuedResult.certificate.studentEmail})
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-muted small">Cryptographic File Hash (SHA-256):</span>
                    <div className="font-monospace small bg-light p-2 rounded text-break border">
                      {issuedResult.certificate.fileHash}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-muted small">Blockchain Anchoring Block:</span>
                    <div className="small fw-semibold">
                      Block #{issuedResult.blockchainProof.blockIndex} [
                      <span className="font-monospace">{issuedResult.blockchainProof.blockHash.substring(0, 16)}...</span>]
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <Link
                      to={`/verify?id=${issuedResult.certificate.certificateId}`}
                      className="btn btn-primary btn-sm"
                    >
                      <i className="bi bi-search me-1"></i> Open Public Verification View
                    </Link>
                    {issuedResult.certificate.cloudinaryUrl && (
                      <a
                        href={issuedResult.certificate.cloudinaryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <i className="bi bi-file-earmark-pdf me-1"></i> View Generated PDF Certificate
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-light border p-4 text-center text-muted">
                <i className="bi bi-shield-lock fs-1 text-primary mb-2"></i>
                <h6>Cryptographic Security Guarantee</h6>
                <p className="small mb-0">
                  Every issued certificate is instantly hashed with SHA-256, streamed to Cloudinary / storage, anchored in the MongoDB-persisted blockchain ledger, and made ready for dual-verifier consensus.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Issued List */}
      {activeTab === 'list' && (
        <div className="card border shadow-sm">
          <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
            <h5 className="card-title mb-0 fs-6 fw-bold">
              <i className="bi bi-collection me-2 text-primary"></i> Registered Credentials
            </h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchCertificates} disabled={fetchingList}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
          <div className="card-body p-0">
            {fetchingList ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <div className="small text-muted mt-2">Loading certificates...</div>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-2 mb-2 d-block"></i>
                No certificates issued yet. Use the issuance tab to create one.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Student</th>
                      <th>Degree & Grade</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                      <th>Consensus</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.certificateId}>
                        <td className="font-monospace fw-bold">{cert.certificateId}</td>
                        <td>
                          <div className="fw-semibold">{cert.studentName}</div>
                          <div className="small text-muted">{cert.studentEmail}</div>
                        </td>
                        <td>
                          <div>{cert.courseName}</div>
                          <div className="small text-muted">{cert.grade}</div>
                        </td>
                        <td className="small">{cert.issueDate}</td>
                        <td>
                          <CertificateStatusBadge status={cert.status} />
                        </td>
                        <td>
                          <ConsensusBadge status={cert.consensusStatus} />
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              to={`/verify?id=${cert.certificateId}`}
                              className="btn btn-outline-primary"
                              title="Public Verification"
                            >
                              <i className="bi bi-search"></i>
                            </Link>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setSelectedQRModalCert(cert)}
                              title="View QR Code"
                            >
                              <i className="bi bi-qr-code"></i>
                            </button>
                            {cert.status === 'active' && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => setRevokeModalCert(cert)}
                                title="Revoke Certificate"
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {revokeModalCert && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-danger">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Revoke Certificate: {revokeModalCert.certificateId}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setRevokeModalCert(null)}
                ></button>
              </div>
              <form onSubmit={handleRevokeSubmit}>
                <div className="modal-body py-3">
                  <p className="small text-muted">
                    Revoking a certificate is an <strong>immutable blockchain action</strong>. The revocation reason and timestamp will be permanently anchored to the ledger.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Recipient:</label>
                    <div>{revokeModalCert.studentName} ({revokeModalCert.studentEmail})</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Official Reason for Revocation *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="e.g. Academic integrity violation: Unauthorized credential duplication identified by university disciplinary committee."
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRevokeModalCert(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm fw-semibold" disabled={revoking}>
                    {revoking ? 'Revoking on Blockchain...' : 'Confirm Official Revocation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        show={!!selectedQRModalCert}
        onHide={() => setSelectedQRModalCert(null)}
        certificate={selectedQRModalCert}
      />
    </div>
  );
}
