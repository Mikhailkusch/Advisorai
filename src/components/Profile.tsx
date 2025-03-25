import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Shield, Bell, Key, Briefcase, FileText, ArrowLeft, X } from 'lucide-react';
import DashboardLayout from './layout/DashboardLayout';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  user: any;
}

export default function Profile({ user }: ProfileProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState<'personal' | 'security' | 'professional' | 'notifications' | 'documents' | 'compliance'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  // Load user data on mount and when user prop changes
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (userData) {
          setCurrentUser(userData);
        }
      } catch (err: any) {
        console.error('Error loading user data:', err);
        setError(err.message);
      }
    };

    loadUserData();
  }, [user]);

  // Function to create form data from user metadata
  const createFormDataFromUser = (userData: any) => ({
    personal: {
      firstName: userData.user_metadata?.first_name || '',
      lastName: userData.user_metadata?.last_name || '',
      email: userData.email || '',
      phone: userData.user_metadata?.phone || '',
      avatar_url: userData.user_metadata?.avatar_url || '',
    },
    professional: {
      title: userData.user_metadata?.title || '',
      company: userData.user_metadata?.company || '',
      licenseNumber: userData.user_metadata?.license_number || '',
      yearsOfExperience: userData.user_metadata?.years_of_experience || '',
      specializations: userData.user_metadata?.specializations || [],
      biography: userData.user_metadata?.biography || '',
    },
    notifications: {
      emailNotifications: userData.user_metadata?.email_notifications ?? true,
      pushNotifications: userData.user_metadata?.push_notifications ?? true,
      clientUpdates: userData.user_metadata?.client_updates ?? true,
      marketAlerts: userData.user_metadata?.market_alerts ?? true,
      complianceReminders: userData.user_metadata?.compliance_reminders ?? true,
    }
  });

  const [initialFormData, setInitialFormData] = useState(createFormDataFromUser(currentUser));
  const [formData, setFormData] = useState(initialFormData);

  // Update form data when user metadata changes
  useEffect(() => {
    const newFormData = createFormDataFromUser(currentUser);
    setInitialFormData(newFormData);
    setFormData(newFormData);
  }, [currentUser]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialFormData]);

  const handleNavigateAway = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      navigate('/dashboard', { 
        state: { 
          selectedTab: (location.state as any)?.previousTab || 'responses'
        } 
      });
    }
  };

  const handleConfirmNavigation = () => {
    setShowUnsavedModal(false);
    navigate('/dashboard', { 
      state: { 
        selectedTab: (location.state as any)?.previousTab || 'responses'
      } 
    });
  };

  const handleInputChange = (
    section: 'personal' | 'professional' | 'notifications',
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { personal, professional, notifications } = formData;
      
      // Update user metadata in Supabase Auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          // Personal information
          first_name: personal.firstName,
          last_name: personal.lastName,
          phone: personal.phone,
          avatar_url: personal.avatar_url,
          
          // Professional information
          title: professional.title,
          company: professional.company,
          license_number: professional.licenseNumber,
          years_of_experience: professional.yearsOfExperience,
          specializations: professional.specializations,
          biography: professional.biography,
          
          // Notification preferences
          email_notifications: notifications.emailNotifications,
          push_notifications: notifications.pushNotifications,
          client_updates: notifications.clientUpdates,
          market_alerts: notifications.marketAlerts,
          compliance_reminders: notifications.complianceReminders,
          
          // Add a timestamp for the last update
          updated_at: new Date().toISOString(),
        }
      });

      if (updateError) throw updateError;

      if (data.user) {
        // Update the current user state with the new data
        setCurrentUser(data.user);
        // Update the initial form data to reflect the saved state
        setInitialFormData(createFormDataFromUser(data.user));
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-md shadow-lg z-50';
        successMessage.textContent = 'Profile updated successfully';
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
      } else {
        throw new Error('Failed to update user data');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'professional', label: 'Professional Details', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'compliance', label: 'Compliance', icon: Key },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'personal':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={formData.personal.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                  alt="Profile"
                  className="h-24 w-24 rounded-full border-2 border-gray-700"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white hover:bg-primary-700"
                >
                  <User className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-100">Profile Picture</h2>
                <p className="text-sm text-gray-400 mt-1">Update your profile picture</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.personal.firstName}
                  onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.personal.lastName}
                  onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.personal.email}
                  disabled
                  className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.personal.phone}
                  onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !hasUnsavedChanges}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        );

      case 'professional':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                  Professional Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.professional.title}
                  onChange={(e) => handleInputChange('professional', 'title', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.professional.company}
                  onChange={(e) => handleInputChange('professional', 'company', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-300">
                  License Number
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  value={formData.professional.licenseNumber}
                  onChange={(e) => handleInputChange('professional', 'licenseNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-300">
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="yearsOfExperience"
                  value={formData.professional.yearsOfExperience}
                  onChange={(e) => handleInputChange('professional', 'yearsOfExperience', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="specializations" className="block text-sm font-medium text-gray-300">
                  Specializations
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {['Retirement Planning', 'Estate Planning', 'Tax Planning', 'Investment Management', 'Insurance Planning'].map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        const currentSpecs = formData.professional.specializations;
                        const newSpecs = currentSpecs.includes(spec)
                          ? currentSpecs.filter((s: string) => s !== spec)
                          : [...currentSpecs, spec];
                        handleInputChange('professional', 'specializations', newSpecs);
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.professional.specializations.includes(spec)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="biography" className="block text-sm font-medium text-gray-300">
                  Professional Biography
                </label>
                <textarea
                  id="biography"
                  rows={4}
                  value={formData.professional.biography}
                  onChange={(e) => handleInputChange('professional', 'biography', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !hasUnsavedChanges}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        );

      case 'notifications':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-100">Email Notifications</h3>
              <div className="mt-4 space-y-4">
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label htmlFor={key} className="text-sm font-medium text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-sm text-gray-400">
                        Receive notifications about {key.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={value}
                      onClick={() => handleInputChange('notifications', key, !value)}
                      className={`${
                        value ? 'bg-primary-600' : 'bg-gray-700'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out`}
                    >
                      <span
                        className={`${
                          value ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-1`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !hasUnsavedChanges}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-100">Password</h3>
              <p className="mt-1 text-sm text-gray-400">
                Update your password to keep your account secure
              </p>
              <form className="mt-6 space-y-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-100">Two-Factor Authentication</h3>
              <p className="mt-1 text-sm text-gray-400">
                Add an extra layer of security to your account
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-100">Professional Documents</h3>
              <p className="mt-1 text-sm text-gray-400">
                Upload and manage your professional certifications and licenses
              </p>
              <div className="mt-6 space-y-4">
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-100">Financial Advisor License</h4>
                      <p className="text-xs text-gray-400">PDF • Uploaded 3 months ago</p>
                    </div>
                    <button className="text-primary-500 hover:text-primary-400 text-sm font-medium">
                      Update
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300"
                >
                  + Upload New Document
                </button>
              </div>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-100">Compliance Requirements</h3>
              <p className="mt-1 text-sm text-gray-400">
                Track and maintain your compliance requirements
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-100">Annual Compliance Training</h4>
                    <p className="text-xs text-gray-400">Due in 45 days</p>
                  </div>
                  <button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm">
                    Start
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-100">Code of Ethics Attestation</h4>
                    <p className="text-xs text-gray-400">Completed 2 months ago</p>
                  </div>
                  <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-md text-sm">
                    Complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>
          <button
            onClick={handleNavigateAway}
            className="flex items-center text-gray-400 hover:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`
                      py-4 px-1 inline-flex items-center space-x-2 border-b-2 font-medium text-sm
                      ${selectedTab === tab.id
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Unsaved Changes Modal */}
        {showUnsavedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 relative">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Unsaved Changes</h3>
              <p className="text-gray-300 mb-6">
                You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowUnsavedModal(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmNavigation}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Leave Without Saving
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 