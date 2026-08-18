import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user.role === 'institution') {
        navigate('/institution');
      } else if (data.user.role === 'verifier') {
        navigate('/verifier');
      } else if (data.user.role === 'student') {
        navigate('/student');
      } else {
        navigate('/institution');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-0 fs-6 fw-bold text-center">
                <i className="bi bi-box-arrow-in-right me-2"></i> Log in to Credora v2
              </h5>
            </div>
            <div className="card-body p-4">
              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Authenticating...
                    </>
                  ) : (
                    'Log In'
                  )}
                </button>
              </form>

              <div className="text-center mt-3 small">
                Don't have an account?{' '}
                <Link to="/register" className="fw-semibold">
                  Register here
                </Link>
              </div>
            </div>
          </div>

          {/* Judge / Quick Demo Accounts */}
          <div className="card border bg-white">
            <div className="card-header bg-light py-2">
              <span className="small fw-bold text-muted">
                <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Demo Logins (Judges / Testing)
              </span>
            </div>
            <div className="card-body p-3">
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm text-start"
                  onClick={() => quickFill('issuer_stanford@credora.org')}
                >
                  <div className="fw-bold">🏫 Stanford Registrar (Institution)</div>
                  <div className="small text-muted font-monospace">issuer_stanford@credora.org</div>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-success btn-sm text-start"
                  onClick={() => quickFill('verifier_google@credora.org')}
                >
                  <div className="fw-bold">🏢 Sarah Chen (Google HR Verifier)</div>
                  <div className="small text-muted font-monospace">verifier_google@credora.org</div>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-success btn-sm text-start"
                  onClick={() => quickFill('verifier_msft@credora.org')}
                >
                  <div className="fw-bold">🏢 David Miller (Microsoft Verifier)</div>
                  <div className="small text-muted font-monospace">verifier_msft@credora.org</div>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm text-start"
                  onClick={() => quickFill('alice@student.credora.org')}
                >
                  <div className="fw-bold">🎓 Alice Johnson (Student)</div>
                  <div className="small text-muted font-monospace">alice@student.credora.org</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
