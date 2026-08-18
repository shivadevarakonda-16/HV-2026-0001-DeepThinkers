import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeModal({ show, onHide, certificate }) {
  const [copied, setCopied] = useState(false);

  if (!show || !certificate) return null;

  const clientUrl = window.location.origin;
  const verificationUrl = `${clientUrl}/verify?id=${certificate.certificateId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fs-6 fw-bold">
              <i className="bi bi-qr-code me-2 text-primary"></i>
              Certificate QR & Share Link
            </h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body text-center py-4">
            <div className="p-3 bg-white d-inline-block border rounded mb-3 shadow-sm">
              <QRCodeSVG value={verificationUrl} size={180} level="H" includeMargin={true} />
            </div>

            <h6 className="fw-bold mb-1">{certificate.studentName}</h6>
            <div className="text-muted small mb-2">{certificate.courseName}</div>
            <div className="badge bg-secondary mb-3">{certificate.certificateId}</div>

            <div className="input-group mb-2">
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                readOnly
                value={verificationUrl}
              />
              <button
                className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-primary'}`}
                type="button"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <i className="bi bi-check2 me-1"></i> Copied!
                  </>
                ) : (
                  <>
                    <i className="bi bi-clipboard me-1"></i> Copy Link
                  </>
                )}
              </button>
            </div>
            <small className="text-muted">
              Scanning this QR code immediately executes a 3-layer cryptographic and dual-verifier check.
            </small>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
