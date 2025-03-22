import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import UserMenu from '../UserMenu';

interface DashboardHeaderProps {
  onAddNew?: (type: 'client' | 'prompt') => void;
  onShowImport?: () => void;
  user: any;
}

export default function DashboardHeader({ onAddNew, onShowImport, user }: DashboardHeaderProps) {
  const [showAddNewMenu, setShowAddNewMenu] = useState(false);

  const handleAddNew = (type: 'client' | 'prompt') => {
    setShowAddNewMenu(false);
    if (onAddNew) {
      onAddNew(type);
    }
  };

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-primary-500" />
            <h1 className="ml-2 text-2xl font-semibold text-gray-100">Advisorai</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowAddNewMenu(!showAddNewMenu)}
                className="p-2 text-gray-400 hover:text-gray-300"
              >
                <Plus className="h-6 w-6" />
              </button>
              {showAddNewMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleAddNew('client')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      role="menuitem"
                    >
                      Add New Client
                    </button>
                    <button
                      onClick={() => handleAddNew('prompt')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      role="menuitem"
                    >
                      Add New Prompt
                    </button>
                    {onShowImport && (
                      <button
                        onClick={onShowImport}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        role="menuitem"
                      >
                        Import Clients
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}