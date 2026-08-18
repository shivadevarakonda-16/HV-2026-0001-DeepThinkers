import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [role, setRole] = useState('verifier');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await register({
        name,
        email,
        password,
        role,
        institutionName,
        institutionCode,
        organizationName,
        department,
        studentIdNumber,
      });

      if (data.user.role === 'institution') {
        navigate('/institution');
      } else if (data.user.role === 'verifier') {
        navigate('/verifier');
      } else if (data.user.role === 'student') {
        navigate('/student');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-0 fs-6 fw-bold text-center">
                <i className="bi bi-person-plus-fill me-2"></i> Register New Account — Credora v2
              </h5>
            </div>
            <div className="card-body p-4">
              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

              <form onSubmit={handleRegister}>
                {/* Role Selector */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Account Role:</label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${role === 'verifier' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setRole('verifier')}
                    >
                      <i className="bi bi-check2-all me-1"></i> Verifier / Employer
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${role === 'institution' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setRole('institution')}
                    >
                      <i className="bi bi-building me-1"></i> Institution Issuer
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${role === 'student' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setRole('student')}
                    >
                      <i className="bi bi-mortarboard me-1"></i> Student
                    </button>
                  </div>
                  <div className="form-text small">
                    {role === 'verifier' && '🏢 Verifiers review and cast dual-consensus votes on credentials.'}
                    {role === 'institution' && '🏫 Accredited institutions issue and revoke tamper-proof credentials.'}
                    {role === 'student' && '🎓 Students view, download, and share their cryptographically anchored diplomas.'}
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name / Contact Person</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Sarah Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Official Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="name@org.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Role Specific Fields */}
                {role === 'verifier' && (
                  <div className="p-3 bg-light border rounded mb-3">
                    <label className="form-label small fw-semibold">Verifying Company / Organization Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="e.g. Google LLC (HR Talent Acquisition)"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                    />
                    <label className="form-label small fw-semibold">Department / Verification Division</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. University Recruitment & Compliance"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                )}

                {role === 'institution' && (
                  <div className="p-3 bg-light border rounded mb-3">
                    <label className="form-label small fw-semibold">Institution Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="e.g. Stanford University"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      required
                    />
                    <label className="form-label small fw-semibold">Institution Code (e.g. STAN-001)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. STAN-001"
                      value={institutionCode}
                      onChange={(e) => setInstitutionCode(e.target.value)}
                    />
                  </div>
                )}

                {role === 'student' && (
                  <div className="p-3 bg-light border rounded mb-3">
                    <label className="form-label small fw-semibold">Student ID / Roll Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. STU-STAN-2024-8841"
                      value={studentIdNumber}
                      onChange={(e) => setStudentIdNumber(e.target.value)}
                    />
                  </div>
                )}

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Registering...
                    </>
                  ) : (
                    'Create Account & Sign In'
                  )}
                </button>
              </form>

              <div className="text-center mt-3 small">
                Already have an account?{' '}
                <Link to="/login" className="fw-semibold">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
