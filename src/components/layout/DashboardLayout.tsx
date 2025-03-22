import React from 'react';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
  onAddNew?: (type: 'client' | 'prompt') => void;
  onShowImport?: () => void;
}

export default function DashboardLayout({ children, user, onAddNew, onShowImport }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      <DashboardHeader 
        user={user} 
        onAddNew={onAddNew}
        onShowImport={onShowImport}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}