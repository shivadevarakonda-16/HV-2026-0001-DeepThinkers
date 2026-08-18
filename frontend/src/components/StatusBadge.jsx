import React from 'react';

export function VerdictBadge({ verdict }) {
  switch (verdict) {
    case 'VERIFIED_AUTHENTIC':
      return <span className="badge bg-success py-2 px-3 fs-6">✅ Authentic & Valid</span>;
    case 'REVOKED':
      return <span className="badge bg-danger py-2 px-3 fs-6">⛔ Revoked Certificate</span>;
    case 'TAMPERED_HASH_MISMATCH':
      return <span className="badge bg-danger py-2 px-3 fs-6">🚨 Tampered / Hash Mismatch</span>;
    case 'NOT_FOUND':
      return <span className="badge bg-secondary py-2 px-3 fs-6">❓ Certificate Not Found</span>;
    default:
      return <span className="badge bg-secondary py-2 px-3 fs-6">{verdict}</span>;
  }
}

export function ConsensusBadge({ status, confirms = 0, flags = 0 }) {
  if (status === 'dual_verified' || confirms >= 2) {
    return (
      <span className="badge bg-success d-inline-flex align-items-center gap-1">
        <i className="bi bi-patch-check-fill"></i> Dual-Verified ({confirms}/2)
      </span>
    );
  }
  if (status === 'flagged' || flags > 0) {
    return (
      <span className="badge bg-danger d-inline-flex align-items-center gap-1">
        <i className="bi bi-exclamation-triangle-fill"></i> Flagged for Review ({flags})
      </span>
    );
  }
  return (
    <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
      <i className="bi bi-hourglass-split"></i> Consensus Pending ({confirms}/2)
    </span>
  );
}

export function CertificateStatusBadge({ status }) {
  if (status === 'revoked') {
    return <span className="badge bg-danger">Revoked</span>;
  }
  return <span className="badge bg-success">Active</span>;
}
