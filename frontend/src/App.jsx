import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import InstitutionDashboard from './pages/InstitutionDashboard';
import StudentDashboard from './pages/StudentDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import BlockchainExplorerPage from './pages/BlockchainExplorerPage';
import TamperSandboxPage from './pages/TamperSandboxPage';
import AuditLogsPage from './pages/AuditLogsPage';

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <main className="flex-shrink-0">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/explorer" element={<BlockchainExplorerPage />} />
          <Route path="/tamper-sandbox" element={<TamperSandboxPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />

          {/* Role-Guarded Dashboards */}
          <Route
            path="/institution"
            element={
              <ProtectedRoute allowedRoles={['institution', 'admin']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier"
            element={
              <ProtectedRoute allowedRoles={['verifier', 'admin']}>
                <VerifierDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
