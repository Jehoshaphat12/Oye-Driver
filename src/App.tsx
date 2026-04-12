import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DriverLoginPage  from './pages/DriverLoginPage';
import DriverSignUpPage from './pages/DriverSignUpPage';
import DriverHomePage   from './pages/DriverHomePage';
import EarningsPage     from './pages/EarningsPage';
import DriverHistoryPage  from './pages/DriverHistoryPage';
import DriverProfilePage  from './pages/DriverProfilePage';
import InstallPrompt from './components/InstallPrompt';
import './styles/globals.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={splashStyles.screen}>
        <div style={splashStyles.logoBox}>
          <span style={splashStyles.logoText}>OyeRide</span>
          <span style={splashStyles.logoSub}>DRIVER</span>
        </div>
        <div style={splashStyles.spinner} />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <InstallPrompt />
      <Routes>
        <Route path="/login"  element={<PublicRoute><DriverLoginPage  /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><DriverSignUpPage /></PublicRoute>} />
        <Route path="/"        element={<ProtectedRoute><DriverHomePage    /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute><EarningsPage       /></ProtectedRoute>} />
        <Route path="/history"  element={<ProtectedRoute><DriverHistoryPage  /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><DriverProfilePage  /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

const splashStyles: Record<string, React.CSSProperties> = {
  screen: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, #061ffa 0%, #0215be 60%, #030e8c 100%)',
    gap: 32,
  },
  logoBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  logoText: {
    fontSize: 36, fontWeight: 700, color: 'white', letterSpacing: -0.5,
    fontFamily: "'Poppins', sans-serif",
  },
  logoSub: {
    fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4, fontFamily: "'Poppins', sans-serif",
  },
  spinner: {
    width: 28, height: 28, border: '3px solid rgba(255,255,255,0.2)',
    borderTop: '3px solid white', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
