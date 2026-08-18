import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ConsensusBadge, CertificateStatusBadge } from '../components/StatusBadge';
import QRCodeModal from '../components/QRCodeModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRModalCert, setSelectedQRModalCert] = useState(null);

  useEffect(() => {
    const fetchStudentCertificates = async () => {
      try {
        const res = await api.get('/certificates/mine');
        if (res.data.success) {
          setCertificates(res.data.certificates);
        }
      } catch (err) {
        console.error('Failed to fetch student credentials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCertificates();
  }, []);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-mortarboard me-2 text-primary"></i>
            My Academic Credentials
          </h2>
          <div className="text-muted small">
            Student: {user?.name} · ID: {user?.studentIdNumber || user?.email}
          </div>
        </div>
        <div className="mt-2 mt-md-0">
          <span className="badge bg-secondary fs-6 py-2 px-3">
            {certificates.length} Registered Diploma{certificates.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted small mt-2">Loading your cryptographically anchored credentials...</div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="card p-5 text-center bg-white border">
          <i className="bi bi-award fs-1 text-muted mb-2"></i>
          <h5>No Credentials Found</h5>
          <p className="text-muted small">
            No academic certificates have been issued under your email (<code>{user?.email}</code>) yet.
            Once your institution issues a diploma, it will appear here automatically.
          </p>
          <div className="mt-2">
            <Link to="/verify" className="btn btn-outline-primary btn-sm">
              Verify an Existing Certificate by ID
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {certificates.map((cert) => (
            <div className="col-md-6" key={cert.certificateId}>
              <div className="card h-100 border shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                  <span className="font-monospace small fw-bold text-primary">{cert.certificateId}</span>
                  <div className="d-flex gap-1">
                    <CertificateStatusBadge status={cert.status} />
                    <ConsensusBadge status={cert.consensusStatus} />
                  </div>
                </div>
                <div className="card-body p-4">
                  <h5 className="card-title fw-bold text-dark mb-1">{cert.courseName}</h5>
                  <div className="text-muted small mb-2">
                    <i className="bi bi-building me-1"></i> {cert.institutionName}
                  </div>

                  <div className="bg-light p-2 rounded mb-3 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Specialization / Major:</span>
                      <span className="fw-semibold">{cert.major || 'General'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Honors / Grade:</span>
                      <span className="fw-semibold text-success">{cert.grade}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Conferred Date:</span>
                      <span>{cert.issueDate}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="small text-muted mb-1">SHA-256 File Hash:</div>
                    <div className="font-monospace small bg-white p-2 border rounded text-truncate">
                      {cert.fileHash}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-auto">
                    <Link to={`/verify?id=${cert.certificateId}`} className="btn btn-primary btn-sm">
                      <i className="bi bi-shield-check me-1"></i> Public Verification
                    </Link>
                    {cert.cloudinaryUrl && (
                      <a
                        href={cert.cloudinaryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <i className="bi bi-download me-1"></i> Download PDF
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      onClick={() => setSelectedQRModalCert(cert)}
                    >
                      <i className="bi bi-qr-code me-1"></i> QR & Share
                    </button>
                  </div>
                </div>
                <div className="card-footer bg-white border-top small text-muted py-2">
                  <i className="bi bi-link-45deg me-1"></i> Anchored in Block #{cert.blockIndex || 1}
                </div>
              </div>
            </div>
          ))}
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
