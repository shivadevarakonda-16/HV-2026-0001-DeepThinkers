import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ConsensusBadge } from '../components/StatusBadge';

export default function VerifierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingCerts, setPendingCerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVerifierData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/certificates/verifier/pending'),
        api.get('/certificates/verifier/history'),
      ]);

      if (pendingRes.data.success) {
        setPendingCerts(pendingRes.data.certificates);
      }
      if (historyRes.data.success) {
        setHistory(historyRes.data.history);
      }
    } catch (err) {
      console.error('Failed to load verifier portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifierData();
  }, []);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-shield-check me-2 text-success"></i>
            Verifier & Employer Consensus Portal
          </h2>
          <div className="text-muted small">
            Organization: <strong>{user?.organizationName || user?.name}</strong> · Verifier: {user?.name} ({user?.email})
          </div>
        </div>
        <div className="mt-2 mt-md-0">
          <span className="badge bg-success fs-6 py-2 px-3">
            <i className="bi bi-building-check me-1"></i> Authorized Verifier
          </span>
        </div>
      </div>

      {/* Info Banner on Dual-Verifier Feature */}
      <div className="card bg-white border-primary border-opacity-25 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            <div className="fs-2 text-primary">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <h5 className="card-title fw-bold text-primary mb-1">Dual-Verifier Consensus Layer</h5>
              <p className="card-text small text-secondary mb-0">
                While SHA-256 cryptographic hashing guarantees that credentials have not been tampered with byte-for-byte, organizational trust requires independent human verification. In Credora v2, a credential only receives the prestigious <strong>"✅ Dual-Verified"</strong> mark once <strong>two distinct verified organizations</strong> confirm its validity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">PENDING YOUR REVIEW</div>
            <div className="fs-3 fw-bold text-warning">{pendingCerts.length}</div>
            <small className="text-muted">Awaiting your organization's consensus vote</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">REVIEWED BY YOU</div>
            <div className="fs-3 fw-bold text-success">{history.length}</div>
            <small className="text-muted">Completed credential reviews</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">CONSENSUS REQUIREMENT</div>
            <div className="fs-3 fw-bold text-primary">2 Confirmations</div>
            <small className="text-muted">Required for dual-verified public badge</small>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="bi bi-hourglass-split me-1"></i> Pending Verification Queue ({pendingCerts.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'history' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history me-1"></i> My Review History ({history.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: Pending Queue */}
      {activeTab === 'pending' && (
        <div className="card border shadow-sm">
          <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
            <h5 className="card-title mb-0 fs-6 fw-bold">
              <i className="bi bi-card-checklist me-2 text-primary"></i>
              Credentials Needing Verification Vote
            </h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchVerifierData} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <div className="small text-muted mt-2">Loading pending verification queue...</div>
              </div>
            ) : pendingCerts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-check2-all fs-2 mb-2 d-block text-success"></i>
                All active credentials have been reviewed by your organization!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Certificate ID</th>
                      <th>Candidate / Student</th>
                      <th>Issuing Institution</th>
                      <th>Degree Title</th>
                      <th>Current Consensus</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCerts.map((cert) => (
                      <tr key={cert.certificateId}>
                        <td className="font-monospace fw-bold">{cert.certificateId}</td>
                        <td>
                          <div className="fw-semibold">{cert.studentName}</div>
                          <div className="small text-muted">{cert.studentEmail}</div>
                        </td>
                        <td>{cert.institutionName}</td>
                        <td>
                          <div>{cert.courseName}</div>
                          <div className="small text-muted">{cert.grade}</div>
                        </td>
                        <td>
                          <ConsensusBadge status={cert.consensusStatus} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary fw-semibold"
                            onClick={() => navigate(`/verify?id=${cert.certificateId}`)}
                          >
                            <i className="bi bi-clipboard2-check me-1"></i> Review & Vote
                          </button>
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

      {/* Tab 2: Review History */}
      {activeTab === 'history' && (
        <div className="card border shadow-sm">
          <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
            <h5 className="card-title mb-0 fs-6 fw-bold">
              <i className="bi bi-journal-check me-2 text-success"></i>
              My Organization's Recorded Votes
            </h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchVerifierData} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-2 mb-2 d-block"></i>
                You have not cast any verification votes yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Certificate ID</th>
                      <th>Candidate & Degree</th>
                      <th>Your Vote</th>
                      <th>Notes / Comment</th>
                      <th>Voted At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.voteId}>
                        <td className="font-monospace fw-bold">{item.certificateId}</td>
                        <td>
                          <div className="fw-semibold">{item.certificate?.studentName || 'Candidate'}</div>
                          <div className="small text-muted">{item.certificate?.courseName || 'Credential'}</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.vote === 'confirm' ? 'bg-success' : 'bg-danger'
                            }`}
                          >
                            {item.vote === 'confirm' ? '✅ Confirmed Authentic' : '🚩 Flagged as Suspicious'}
                          </span>
                        </td>
                        <td className="small font-monospace text-muted">
                          {item.comment ? `"${item.comment}"` : <span className="opacity-50">None</span>}
                        </td>
                        <td className="small">{new Date(item.votedAt).toLocaleString()}</td>
                        <td>
                          <Link to={`/verify?id=${item.certificateId}`} className="btn btn-outline-primary btn-sm">
                            Inspect
                          </Link>
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
    </div>
  );
}
