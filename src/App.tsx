import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ClientDashboard from './components/ClientDashboard';
import AuthModal from './components/AuthModal';
import { getCurrentUser } from './lib/auth';
import { Zap } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const user = await getCurrentUser();
      setUser(user);
      setAuthError(null);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setAuthError('Failed to authenticate. Please try signing in again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-100">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Zap className="h-12 w-12 text-primary-500" />
            <h1 className="text-4xl font-bold text-gray-100 ml-3">Advisorai</h1>
          </div>
          {authError && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md">
              {authError}
            </div>
          )}
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Sign In / Sign Up
          </button>
          {showAuthModal && (
            <AuthModal
              onClose={() => setShowAuthModal(false)}
              onSuccess={() => {
                checkUser();
                setShowAuthModal(false);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/clients/:id" element={<ClientDashboard />} />
      </Routes>
    </Router>
  );
}

export default App