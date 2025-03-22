import React from 'react';

interface TabNavigationProps {
  selectedTab: 'responses' | 'clients' | 'emails' | 'prompts' | 'proposals';
  onTabChange: (tab: 'responses' | 'clients' | 'emails' | 'prompts' | 'proposals') => void;
}

export default function TabNavigation({ selectedTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-700 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('responses')}
          className={`${
            selectedTab === 'responses'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Emails
        </button>
        <button
          onClick={() => onTabChange('proposals')}
          className={`${
            selectedTab === 'proposals'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Proposals
        </button>
        <button
          onClick={() => onTabChange('clients')}
          className={`${
            selectedTab === 'clients'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Clients
        </button>
        <button
          onClick={() => onTabChange('prompts')}
          className={`${
            selectedTab === 'prompts'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Prompts
        </button>
        <button
          onClick={() => onTabChange('emails')}
          className={`${
            selectedTab === 'emails'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Gmail
        </button>
      </nav>
    </div>
  );
}