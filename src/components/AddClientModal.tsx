import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';

interface AddClientModalProps {
  onClose: () => void;
  onClientAdded: (client: Client) => void;
}

export default function AddClientModal({ onClose, onClientAdded }: AddClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    portfolioValue: '',
    riskProfile: 'moderate' as Client['riskProfile'],
  });

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { count, error } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)
        .eq('user_id', user.id);

      if (error) throw error;
      return count === 0;
    } catch (error) {
      console.error('Error checking email:', error);
      throw new Error('Failed to validate email');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // First check if email is available for this user
      const isEmailAvailable = await validateEmail(formData.email);
      if (!isEmailAvailable) {
        setError('A client with this email already exists in your account');
        setIsSubmitting(false);
        return;
      }

      const newClient = {
        name: formData.name,
        email: formData.email,
        portfolio_value: parseFloat(formData.portfolioValue),
        risk_profile: formData.riskProfile,
        status: 'active' as const,
        last_contact: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          setError('A client with this email already exists in your account');
          return;
        }
        throw insertError;
      }

      if (data) {
        onClientAdded({
          id: data.id,
          name: data.name,
          email: data.email,
          portfolioValue: data.portfolio_value,
          riskProfile: data.risk_profile,
          status: data.status,
          lastContact: new Date(data.last_contact),
        });
        onClose();
      }
    } catch (error) {
      console.error('Error adding client:', error);
      setError('Failed to add client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Add New Client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
              required
              value={formData.email}
              onChange={(e) => {
                setError(null);
                setFormData((prev) => ({ ...prev, email: e.target.value }));
              }}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="portfolioValue" className="block text-sm font-medium text-gray-300">
              Portfolio Value
            </label>
            <input
              type="number"
              id="portfolioValue"
              required
              min="0"
              step="1000"
              value={formData.portfolioValue}
              onChange={(e) => setFormData((prev) => ({ ...prev, portfolioValue: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="riskProfile" className="block text-sm font-medium text-gray-300">
              Risk Profile
            </label>
            <select
              id="riskProfile"
              required
              value={formData.riskProfile}
              onChange={(e) => setFormData((prev) => ({ ...prev, riskProfile: e.target.value as Client['riskProfile'] }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}