import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [certFilter, setCertFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (certFilter) params.append('certificateId', certFilter);
      if (roleFilter) params.append('actorRole', roleFilter);
      params.append('limit', '50');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, roleFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'ISSUE_CERTIFICATE':
        return 'bg-success';
      case 'REVOKE_CERTIFICATE':
        return 'bg-danger';
      case 'VERIFIER_VOTE_CAST':
        return 'bg-primary';
      case 'VERIFY_CERTIFICATE_ID':
      case 'VERIFY_CERTIFICATE_FILE':
        return 'bg-info text-dark';
      case 'USER_LOGIN':
      case 'USER_REGISTER':
        return 'bg-secondary';
      default:
        return 'bg-dark';
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-journal-text me-2 text-primary"></i>
            System Audit & Governance Trail
          </h2>
          <div className="text-muted small">
            Immutable Historical Log of All Issuances, Consensus Votes, Verifications, and Revocations
          </div>
        </div>
        <div className="mt-2 mt-md-0">
          <span className="badge bg-secondary fs-6 py-2 px-3">
            {total} Total Audit Records
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card border shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleFilterSubmit} className="row g-2 align-items-center">
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">Filter by Action:</label>
              <select
                className="form-select form-select-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="ISSUE_CERTIFICATE">ISSUE_CERTIFICATE</option>
                <option value="REVOKE_CERTIFICATE">REVOKE_CERTIFICATE</option>
                <option value="VERIFIER_VOTE_CAST">VERIFIER_VOTE_CAST (Consensus)</option>
                <option value="VERIFY_CERTIFICATE_ID">VERIFY_CERTIFICATE_ID</option>
                <option value="VERIFY_CERTIFICATE_FILE">VERIFY_CERTIFICATE_FILE</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="USER_REGISTER">USER_REGISTER</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">Filter by Role:</label>
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="institution">Institution</option>
                <option value="verifier">Verifier / HR</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="public">Public / Anonymous</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold mb-1">Certificate ID Search:</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                placeholder="e.g. CRED-STAN-2026-001"
                value={certFilter}
                onChange={(e) => setCertFilter(e.target.value)}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-primary btn-sm w-100 mt-md-4">
                <i className="bi bi-filter me-1"></i> Apply Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card border shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <div className="small text-muted mt-2">Loading audit logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted">No audit logs matching current filter.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Target Certificate</th>
                    <th>IP Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="small text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getActionBadgeClass(log.action)} font-monospace`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="small fw-semibold">{log.actorEmail}</td>
                      <td>
                        <span className="badge bg-light text-dark border text-capitalize small">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="font-monospace small fw-bold text-primary">
                        {log.certificateId || '—'}
                      </td>
                      <td className="font-monospace small text-muted">{log.ipAddress}</td>
                      <td>
                        <span className={`badge ${log.success ? 'bg-success' : 'bg-danger'}`}>
                          {log.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
