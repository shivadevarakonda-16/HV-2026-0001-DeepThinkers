import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function TamperSandboxPage() {
  const [certificates, setCertificates] = useState([]);
  const [selectedCertId, setSelectedCertId] = useState('CRED-STAN-2026-001');
  const [selectedCert, setSelectedCert] = useState(null);

  // Tamper Form Fields
  const [studentName, setStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [grade, setGrade] = useState('');
  const [issueDate, setIssueDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await api.get('/certificates/all');
        if (res.data.success) {
          setCertificates(res.data.certificates);
          const initial = res.data.certificates.find((c) => c.certificateId === 'CRED-STAN-2026-001') || res.data.certificates[0];
          if (initial) {
            setSelectedCertId(initial.certificateId);
            populateFields(initial);
          }
        }
      } catch (err) {
        console.error('Failed to load certificates for sandbox:', err);
      }
    };

    fetchCerts();
  }, []);

  const populateFields = (cert) => {
    setSelectedCert(cert);
    setStudentName(cert.studentName);
    setCourseName(cert.courseName);
    setGrade(cert.grade);
    setIssueDate(cert.issueDate);
    setTamperResult(null);
  };

  const handleSelectCert = (e) => {
    const id = e.target.value;
    setSelectedCertId(id);
    const found = certificates.find((c) => c.certificateId === id);
    if (found) {
      populateFields(found);
    }
  };

  const handleTamperVerify = async (e) => {
    e.preventDefault();
    if (!selectedCert) return;

    setLoading(true);
    try {
      const res = await api.post('/demo/tamper', {
        certificateId: selectedCert.certificateId,
        modifiedFields: {
          studentName,
          courseName,
          grade,
          issueDate,
        },
      });

      if (res.data.success) {
        setTamperResult(res.data);
      }
    } catch (err) {
      alert('Tamper simulation request failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetToOriginal = () => {
    if (selectedCert) {
      populateFields(selectedCert);
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-tools me-2 text-danger"></i>
            Tamper Sandbox & Cryptographic Defense Demo
          </h2>
          <div className="text-muted small">
            Interactive Testbed for Judges · Real-Time SHA-256 Hash Mismatch Simulation
          </div>
        </div>
        <div className="mt-2 mt-md-0">
          <span className="badge bg-danger fs-6 py-2 px-3">
            <i className="bi bi-bug-fill me-1"></i> Judge Tamper Simulator
          </span>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Tampering Controls */}
        <div className="col-lg-6">
          <div className="card border shadow-sm">
            <div className="card-header bg-light py-3">
              <h5 className="card-title mb-0 fs-6 fw-bold">
                <i className="bi bi-pencil-square me-2 text-primary"></i>
                1. Select Certificate & Inject Tampered Fields
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label small fw-semibold">Target Certificate for Testing:</label>
                <select
                  className="form-select font-monospace"
                  value={selectedCertId}
                  onChange={handleSelectCert}
                >
                  {certificates.map((c) => (
                    <option key={c.certificateId} value={c.certificateId}>
                      {c.certificateId} — {c.studentName} ({c.courseName.substring(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              {selectedCert && (
                <form onSubmit={handleTamperVerify}>
                  <div className="p-3 bg-light border rounded mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-bold text-secondary">Modify Any Field Below:</span>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={resetToOriginal}
                      >
                        <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Original
                      </button>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold mb-1">Student Name:</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${
                          studentName !== selectedCert.studentName ? 'border-danger bg-danger bg-opacity-10 fw-bold' : ''
                        }`}
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold mb-1">Degree Title:</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${
                          courseName !== selectedCert.courseName ? 'border-danger bg-danger bg-opacity-10 fw-bold' : ''
                        }`}
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold mb-1">Honors / Grade (Try altering):</label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${
                          grade !== selectedCert.grade ? 'border-danger bg-danger bg-opacity-10 fw-bold' : ''
                        }`}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold mb-1">Conferral Date:</label>
                      <input
                        type="date"
                        className={`form-control form-control-sm ${
                          issueDate !== selectedCert.issueDate ? 'border-danger bg-danger bg-opacity-10 fw-bold' : ''
                        }`}
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-50"
                      onClick={() => setGrade('First Class with High Honors (Forged GPA 4.0/4.0)')}
                    >
                      <i className="bi bi-lightning-fill me-1"></i> Quick-Forge Grade
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-50"
                      onClick={() => setStudentName('Mallory Cyber Attacker (Imposter)')}
                    >
                      <i className="bi bi-person-x-fill me-1"></i> Quick-Forge Name
                    </button>
                  </div>

                  <button type="submit" className="btn btn-danger w-100 fw-semibold mt-3" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Executing Cryptographic Hash Verification...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-slash me-1"></i> Execute Verification on Tampered Data
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cryptographic Comparison & Proof */}
        <div className="col-lg-6">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-light py-3">
              <h5 className="card-title mb-0 fs-6 fw-bold">
                <i className="bi bi-shield-lock me-2 text-success"></i>
                2. Cryptographic Integrity Detection
              </h5>
            </div>
            <div className="card-body p-4">
              {tamperResult ? (
                <div>
                  <div
                    className={`alert ${
                      tamperResult.integrityCheck.overallVerdict === 'TAMPERED_HASH_MISMATCH'
                        ? 'alert-danger border-danger'
                        : 'alert-success border-success'
                    } mb-3`}
                  >
                    <div className="fw-bold fs-6 mb-1">
                      {tamperResult.integrityCheck.overallVerdict === 'TAMPERED_HASH_MISMATCH'
                        ? '🚨 Cryptographic Mismatch Detected!'
                        : '✅ Canonical Data Match Verified!'}
                    </div>
                    <div className="small">{tamperResult.integrityCheck.alertMessage}</div>
                  </div>

                  <div className="mb-3">
                    <span className="small fw-semibold text-muted">Original Blockchain-Anchored Hash:</span>
                    <div className="font-monospace small bg-light p-2 rounded text-break border text-success fw-bold mt-1">
                      {tamperResult.originalCertificate.storedMetadataHash}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="small fw-semibold text-muted">Recomputed Hash from Provided Data:</span>
                    <div
                      className={`font-monospace small p-2 rounded text-break border mt-1 ${
                        tamperResult.integrityCheck.overallVerdict === 'TAMPERED_HASH_MISMATCH'
                          ? 'bg-danger bg-opacity-10 border-danger text-danger fw-bold'
                          : 'bg-light text-success fw-bold'
                      }`}
                    >
                      {tamperResult.recalculatedHashes.metadataHash}
                    </div>
                  </div>

                  <div className="p-3 bg-light border rounded small">
                    <h6 className="fw-bold mb-2 text-dark">Why Tampering Is Cryptographically Impossible:</h6>
                    <ul className="mb-0 ps-3 text-muted">
                      <li>
                        SHA-256 is a <strong>one-way cryptographic hash function</strong>. Any single-bit change to student name, grade, or file bytes causes a completely different avalanche output.
                      </li>
                      <li className="mt-1">
                        The true canonical hash is permanently anchored across immutable blocks in the blockchain ledger and smart contract.
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-cpu fs-1 text-primary mb-2 d-block"></i>
                  <h6>Tamper Sandbox Ready</h6>
                  <p className="small mb-0">
                    Modify one or more fields on the left and click "Execute Verification" to observe instantaneous cryptographic hash mismatch detection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
