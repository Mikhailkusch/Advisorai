import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ClientDashboard from './components/ClientDashboard';
import AuthModal from './components/AuthModal';
import Profile from './components/Profile';
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
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="min-h-screen flex flex-col items-center justify-center px-4">
                  <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                      <Zap className="mx-auto h-12 w-12 text-primary-500" />
                      <h2 className="mt-6 text-3xl font-extrabold text-gray-100">
                        Welcome to AdvisorAI
                      </h2>
                      <p className="mt-2 text-sm text-gray-400">
                        Your AI-powered financial advisory assistant
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/dashboard/*"
            element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/clients/:id"
            element={user ? <ClientDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/" replace />}
          />
        </Routes>

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={(user) => {
              setUser(user);
              setShowAuthModal(false);
            }}
            error={authError}
          />
        )}
      </div>
    </Router>
  );
}

export default App