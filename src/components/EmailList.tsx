import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import type { GmailMessage } from '../types';
import { generateAIResponse } from '../lib/openai';

export default function EmailList() {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingResponse, setGeneratingResponse] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'authenticating' | 'authenticated'>('unauthenticated');

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus().then(isAuthenticated => {
      if (isAuthenticated) {
        fetchEmails();
      }
    });

    // Listen for messages from the OAuth popup window
    const handleAuthMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data;
      if (data.type === 'gmail-auth-complete') {
        if (data.success) {
          setAuthStatus('authenticated');
          // Fetch emails immediately after successful authentication
          fetchEmails().catch(error => {
            console.error('Error fetching emails after auth:', error);
            setError('Failed to fetch emails after authentication');
          });
        } else {
          setAuthStatus('unauthenticated');
          setError(data.error || 'Authentication failed. Please try again.');
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth-status`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to check authentication status');
      }

      const data = await response.json();
      setAuthStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
      return data.authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setError('Failed to check authentication status');
      return false;
    }
  };

  const initializeAuth = async () => {
    try {
      setAuthStatus('authenticating');
      setError(null);

      // Open auth window
      const authWindow = window.open(
        `${import.meta.env.VITE_API_URL}/api/auth/gmail`,
        'Gmail Authorization',
        'width=500,height=600,menubar=no,toolbar=no'
      );

      if (!authWindow) {
        throw new Error(
          'Popup was blocked. Please allow popups for this site and try again.'
        );
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize Gmail authentication');
      setAuthStatus('unauthenticated');
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/emails`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch emails');
      }

      const data = await response.json();
      if (data.messages) {
        setEmails(data.messages);
      } else {
        setEmails([]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch emails');
      setAuthStatus('unauthenticated'); // Reset auth status if we get an auth error
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResponse = async (email: GmailMessage) => {
    setGeneratingResponse(email.id);
    try {
      const emailContent = getEmailBody(email);
      const prompt = `Please draft a professional response to this email: ${emailContent}`;
      
      const response = await generateAIResponse(prompt, 'Email response generation');
      
      const draftResponse = await fetch('http://localhost:3000/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId: email.id,
          content: response.emailResponse,
        }),
      });

      if (!draftResponse.ok) {
        throw new Error('Failed to create draft response');
      }

      alert('Draft response created successfully!');
    } catch (error) {
      console.error('Error generating response:', error);
      alert('Failed to generate response. Please try again.');
    } finally {
      setGeneratingResponse(null);
    }
  };

  const getEmailSubject = (email: GmailMessage) => {
    return email.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
  };

  const getEmailSender = (email: GmailMessage) => {
    return email.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
  };

  const getEmailBody = (email: GmailMessage) => {
    const body = email.payload.body.data || 
                email.payload.parts?.[0]?.body?.data || 
                '';
    return Buffer.from(body, 'base64').toString();
  };

  if (authStatus === 'unauthenticated') {
    return (
      <div className="bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-100">Gmail Authentication Required</h3>
          <p className="mt-1 text-sm text-gray-400">
            You need to authenticate with Gmail to access your emails.
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-md text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={initializeAuth}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Connect Gmail Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === 'authenticating') {
    return (
      <div className="bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader className="w-6 h-6 animate-spin text-primary-500" />
          <p className="text-gray-100">Authenticating with Gmail...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={fetchEmails}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100">Recent Emails</h2>
        <button
          onClick={fetchEmails}
          className="p-2 text-gray-400 hover:text-gray-300"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      <div className="divide-y divide-gray-700">
        {emails.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No emails found
          </div>
        ) : (
          emails.map((email) => (
            <div key={email.id} className="p-4 hover:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-100">{getEmailSender(email)}</p>
                    <p className="text-gray-300">{getEmailSubject(email)}</p>
                    <p className="mt-1 text-sm text-gray-400">{email.snippet}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateResponse(email)}
                  disabled={generatingResponse === email.id}
                  className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
                >
                  {generatingResponse === email.id ? (
                    <span className="flex items-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </span>
                  ) : (
                    'Generate Response'
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}