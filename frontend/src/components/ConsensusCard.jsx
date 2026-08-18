import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ConsensusCard({ certificateId, consensusData, onVoteSubmitted }) {
  const { user, isVerifier } = useAuth();
  const [selectedVote, setSelectedVote] = useState('confirm');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');

  const {
    status = 'pending',
    isDualVerified = false,
    confirmationsCount = 0,
    requiredConfirmations = 2,
    flagsCount = 0,
    votes = [],
  } = consensusData || {};

  const progressPercent = Math.min(100, Math.round((confirmationsCount / requiredConfirmations) * 100));

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setVoteError('');
    setVoteSuccess('');

    try {
      const res = await api.post(`/certificates/${certificateId}/vote`, {
        vote: selectedVote,
        comment,
      });

      if (res.data.success) {
        setVoteSuccess(`Your ${selectedVote.toUpperCase()} vote was recorded successfully!`);
        setComment('');
        if (onVoteSubmitted) {
          onVoteSubmitted(res.data.consensus);
        }
      }
    } catch (err) {
      setVoteError(err.response?.data?.message || 'Failed to submit vote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-4 border">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fs-6 fw-bold">
          <i className="bi bi-people me-2 text-primary"></i> Layer 3: Dual-Verifier Human Consensus
        </h5>
        {isDualVerified ? (
          <span className="badge bg-success py-1 px-2">✅ Dual-Verified (2/2)</span>
        ) : flagsCount > 0 ? (
          <span className="badge bg-danger py-1 px-2">⚠️ Flagged ({flagsCount})</span>
        ) : (
          <span className="badge bg-warning text-dark py-1 px-2">
            ⏳ Pending ({confirmationsCount}/{requiredConfirmations})
          </span>
        )}
      </div>

      <div className="card-body">
        <p className="card-text small text-muted mb-3">
          To prevent misuse and guarantee organizational verification beyond raw hash integrity, credentials require{' '}
          <strong>two independent verified organizations</strong> (e.g. employers, HR recruitment teams) to confirm authenticity.
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="d-flex justify-content-between small fw-semibold mb-1">
            <span>Consensus Progress: {confirmationsCount} of {requiredConfirmations} Confirmations</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="progress" style={{ height: '10px' }}>
            <div
              className={`progress-bar ${
                isDualVerified ? 'bg-success' : flagsCount > 0 ? 'bg-danger' : 'bg-primary'
              }`}
              role="progressbar"
              style={{ width: `${progressPercent}%` }}
              aria-valuenow={progressPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        {/* Flag Alert if any */}
        {flagsCount > 0 && (
          <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
            <div>
              <strong>Under Review:</strong> This certificate has been flagged by {flagsCount} verifier(s) for discrepancies. Both confirm and flag records are transparently listed below.
            </div>
          </div>
        )}

        {/* List of Verifier Votes */}
        <h6 className="fw-semibold small text-secondary mt-3 mb-2">
          <i className="bi bi-shield-shaded me-1"></i> Recorded Verifier Reviews ({votes.length})
        </h6>

        {votes.length === 0 ? (
          <div className="alert alert-light border small text-muted mb-3">
            No verifier votes recorded yet. This certificate is awaiting initial HR/employer review.
          </div>
        ) : (
          <div className="list-group list-group-flush border rounded mb-3">
            {votes.map((v, idx) => (
              <div key={idx} className="list-group-item list-group-item-action py-2">
                <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                  <div className="fw-semibold small">
                    <i className="bi bi-building-check me-1 text-primary"></i>
                    {v.verifierOrgName}
                    <span className="text-muted fw-normal ms-2">({v.verifierName})</span>
                  </div>
                  <span
                    className={`badge ${
                      v.vote === 'confirm' ? 'bg-success' : 'bg-danger'
                    }`}
                  >
                    {v.vote === 'confirm' ? 'Confirmed Authentic' : 'Flagged as Suspicious'}
                  </span>
                </div>
                {v.comment && <p className="mb-1 small text-secondary font-monospace">"{v.comment}"</p>}
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Recorded on: {new Date(v.timestamp).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}

        {/* Verifier Voting Panel */}
        {isVerifier ? (
          <div className="border rounded p-3 bg-light mt-3">
            <h6 className="fw-bold small mb-2 text-primary">
              <i className="bi bi-person-check me-1"></i> Cast Verifier Review as: {user.organizationName || user.name}
            </h6>

            {voteError && <div className="alert alert-danger py-2 small mb-2">{voteError}</div>}
            {voteSuccess && <div className="alert alert-success py-2 small mb-2">{voteSuccess}</div>}

            <form onSubmit={handleVoteSubmit}>
              <div className="mb-2">
                <label className="form-label small fw-semibold mb-1">Verification Decision:</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="voteChoice"
                      id="voteConfirm"
                      value="confirm"
                      checked={selectedVote === 'confirm'}
                      onChange={(e) => setSelectedVote(e.target.value)}
                    />
                    <label className="form-check-label small text-success fw-semibold" htmlFor="voteConfirm">
                      <i className="bi bi-check-circle-fill me-1"></i> Confirm Authentic
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="voteChoice"
                      id="voteFlag"
                      value="flag"
                      checked={selectedVote === 'flag'}
                      onChange={(e) => setSelectedVote(e.target.value)}
                    />
                    <label className="form-check-label small text-danger fw-semibold" htmlFor="voteFlag">
                      <i className="bi bi-flag-fill me-1"></i> Flag as Suspicious
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label small fw-semibold mb-1">Verification Notes / Justification (Optional):</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Cross-referenced with internal university hiring portal"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-check me-1"></i> Submit Official Verification Vote
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="alert alert-light border small text-muted mb-0">
            <i className="bi bi-info-circle me-1"></i> Are you a verified HR or institutional recruiter?{' '}
            <a href="/login" className="alert-link">
              Log in as a Verifier
            </a>{' '}
            to cast your organization's official consensus vote.
          </div>
        )}
      </div>
    </div>
  );
}
