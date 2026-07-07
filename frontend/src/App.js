import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Sidebar from './components/common/Sidebar';
import Loader from './components/common/Loader';
import QuizList from './components/admin/QuizList';
import QuizEditor from './components/admin/QuizEditor';
import ImageUpload from './components/admin/ImageUpload';
import TokenGenerator from './components/admin/TokenGenerator';
import ResponseExporter from './components/admin/ResponseExporter';
import QuizInsights from './components/admin/QuizInsights'; // ✅ ADD THIS
import QuizEntry from './components/participant/QuizEntry';
import QuizPage from './components/participant/QuizPage';
import CompletionScreen from './components/participant/CompletionScreen';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
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

          {/* Participant Routes */}
          <Route path="/quiz/:token" element={<QuizEntry />} />
          <Route path="/quiz/:token/page/:pageNumber" element={<QuizPage />} />
          <Route path="/quiz/:token/complete" element={<CompletionScreen />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Sidebar>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    
                    {/* Quiz Routes */}
                    <Route path="quizzes" element={<QuizList />} />
                    <Route path="quizzes/create" element={<QuizEditor />} />
                    <Route path="quizzes/:id/edit" element={<QuizEditor />} />
                    
                    {/* ✅ Token Generator */}
                    <Route path="quizzes/:id/tokens" element={
                      <div className="p-8">
                        <TokenGenerator />
                      </div>
                    } />
                    
                    {/* ✅ Response Exporter */}
                    <Route path="quizzes/:id/export" element={
                      <div className="p-8">
                        <ResponseExporter />
                      </div>
                    } />
                    
                    {/* ✅ Quiz Insights */}
                    <Route path="quizzes/:id/insights" element={
                      <div className="p-8">
                        <QuizInsights />
                      </div>
                    } />
                    
                    {/* Image Management */}
                    <Route path="images" element={
                      <div className="p-8">
                        <ImageUpload />
                      </div>
                    } />
                    
                    <Route path="tokens" element={
                      <div className="p-8 text-center text-[#1A312C]/60">
                        <div className="glass-card p-12">
                          <h2 className="text-2xl font-bold text-[#1A312C] mb-2">Token Management</h2>
                          <p>Select a quiz to generate tokens</p>
                        </div>
                      </div>
                    } />
                    
                    <Route path="export" element={
                      <div className="p-8 text-center text-[#1A312C]/60">
                        <div className="glass-card p-12">
                          <h2 className="text-2xl font-bold text-[#1A312C] mb-2">Export Data</h2>
                          <p>Select a quiz to export responses</p>
                        </div>
                      </div>
                    } />
                    
                    <Route path="settings" element={
                      <div className="p-8 text-center text-[#1A312C]/60">
                        <div className="glass-card p-12">
                          <h2 className="text-2xl font-bold text-[#1A312C] mb-2">Settings</h2>
                          <p>Coming soon...</p>
                        </div>
                      </div>
                    } />
                    
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </Sidebar>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;