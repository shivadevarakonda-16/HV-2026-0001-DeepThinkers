import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'active fw-bold' : '');

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="fs-4">🎓</span>
          <span className="fw-bold tracking-tight">Credora <small className="fs-6 fw-normal opacity-75">v2</small></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-prev-icon"></span>
          <i className="bi bi-list fs-3 text-white"></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/verify')}`} to="/verify">
                <i className="bi bi-shield-check me-1"></i> Verify Certificate
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/explorer')}`} to="/explorer">
                <i className="bi bi-link-45deg me-1"></i> Blockchain Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/tamper-sandbox')}`} to="/tamper-sandbox">
                <i className="bi bi-tools me-1"></i> Tamper Sandbox
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/audit-logs')}`} to="/audit-logs">
                <i className="bi bi-journal-text me-1"></i> Audit Logs
              </Link>
            </li>

            {/* Role-Specific Dashboards */}
            {isAuthenticated && user?.role === 'institution' && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/institution')}`} to="/institution">
                  <i className="bi bi-building me-1"></i> Institution Portal
                </Link>
              </li>
            )}
            {isAuthenticated && user?.role === 'student' && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/student')}`} to="/student">
                  <i className="bi bi-mortarboard me-1"></i> My Credentials
                </Link>
              </li>
            )}
            {isAuthenticated && (user?.role === 'verifier' || user?.role === 'admin') && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/verifier')}`} to="/verifier">
                  <i className="bi bi-check2-all me-1"></i> Verifier Portal
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-2 text-white">
                <div className="text-end d-none d-md-block">
                  <div className="fw-semibold small">{user.name}</div>
                  <div className="badge bg-light text-dark text-capitalize" style={{ fontSize: '0.75rem' }}>
                    {user.role} {user.organizationName ? `• ${user.organizationName}` : ''}
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-outline-light btn-sm ms-2">
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-light btn-sm fw-semibold text-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
