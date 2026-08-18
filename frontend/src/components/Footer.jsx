import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-top py-4 mt-auto">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
            <span className="fw-semibold text-primary">Credora v2</span> — Academic Certificate & Credential Verification System
            <div className="small text-muted">
              Team DeepThinkers (HV2026-0001) · Problem Statement: HV-CYB-03
            </div>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <span className="badge bg-secondary me-2">SHA-256 Anchored</span>
            <span className="badge bg-primary me-2">Dual-Verifier Consensus</span>
            <span className="badge bg-success">MongoDB Atlas + Cloudinary</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
