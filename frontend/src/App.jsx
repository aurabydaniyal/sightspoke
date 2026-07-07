import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Loader from './components/common/Loader';
import Sidebar from './components/common/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A312C',
            color: '#FFF4E1',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(137, 215, 183, 0.2)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            icon: '✅',
            style: {
              border: '1px solid #89D7B7',
            },
          },
          error: {
            icon: '❌',
            style: {
              border: '1px solid #EF4444',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Admin Routes (Protected) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Sidebar>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="quizzes" element={
                    <div className="glass-card p-8 text-center text-primary/60">
                      Quizzes Management (Coming Soon)
                    </div>
                  } />
                  <Route path="images" element={
                    <div className="glass-card p-8 text-center text-primary/60">
                      Image Management (Coming Soon)
                    </div>
                  } />
                  <Route path="tokens" element={
                    <div className="glass-card p-8 text-center text-primary/60">
                      Token Management (Coming Soon)
                    </div>
                  } />
                  <Route path="export" element={
                    <div className="glass-card p-8 text-center text-primary/60">
                      Export Data (Coming Soon)
                    </div>
                  } />
                  <Route path="settings" element={
                    <div className="glass-card p-8 text-center text-primary/60">
                      Settings (Coming Soon)
                    </div>
                  } />
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </Sidebar>
            </ProtectedRoute>
          }
        />
        
        {/* Participant Routes */}
        <Route path="/quiz/*" element={
          <div className="glass-card p-8 text-center text-primary/60">
            Participant Quiz (Coming Soon)
          </div>
        } />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;