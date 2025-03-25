import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';

interface EditClientModalProps {
  client: Client;
  onClose: () => void;
  onClientUpdated: (client: Client) => void;
  onClientDeleted: (clientId: string) => void;
}

export default function EditClientModal({ client, onClose, onClientUpdated, onClientDeleted }: EditClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: client.name,
    surname: client.surname || '',
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    occupation: client.occupation || '',
    portfolioValue: client.portfolioValue.toString(),
    riskProfile: client.riskProfile,
    status: client.status,
    annualIncome: client.annualIncome?.toString() || '',
    investmentGoals: client.investmentGoals || [],
    riskTolerance: client.riskTolerance || 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          occupation: formData.occupation,
          portfolio_value: parseFloat(formData.portfolioValue),
          risk_profile: formData.riskProfile,
          status: formData.status,
          annual_income: formData.annualIncome ? parseFloat(formData.annualIncome) : null,
          investment_goals: formData.investmentGoals,
          risk_tolerance: formData.riskTolerance,
        })
        .eq('id', client.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onClientUpdated({
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
          phone: data.phone,
          address: data.address,
          occupation: data.occupation,
          portfolioValue: data.portfolio_value,
          riskProfile: data.risk_profile,
          status: data.status,
          lastContact: new Date(data.last_contact),
          annualIncome: data.annual_income,
          investmentGoals: data.investment_goals,
          riskTolerance: data.risk_tolerance,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Failed to update client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      onClientDeleted(client.id);
      onClose();
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Failed to delete client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Edit Client</h2>
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
            <label htmlFor="surname" className="block text-sm font-medium text-gray-300">
              Surname
            </label>
            <input
              type="text"
              id="surname"
              value={formData.surname}
              onChange={(e) => setFormData((prev) => ({ ...prev, surname: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-300">
              Occupation
            </label>
            <input
              type="text"
              id="occupation"
              value={formData.occupation}
              onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
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
            <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-300">
              Annual Income
            </label>
            <input
              type="number"
              id="annualIncome"
              min="0"
              step="1000"
              value={formData.annualIncome}
              onChange={(e) => setFormData((prev) => ({ ...prev, annualIncome: e.target.value }))}
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

          <div>
            <label htmlFor="riskTolerance" className="block text-sm font-medium text-gray-300">
              Risk Tolerance (1-10)
            </label>
            <input
              type="number"
              id="riskTolerance"
              min="1"
              max="10"
              value={formData.riskTolerance}
              onChange={(e) => setFormData((prev) => ({ ...prev, riskTolerance: parseInt(e.target.value) || 5 }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300">
              Status
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Client['status'] }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Investment Goals
            </label>
            <div className="space-y-2">
              {['Retirement', 'Education', 'Real Estate', 'Wealth Building', 'Tax Planning'].map((goal) => (
                <label key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.investmentGoals.includes(goal)}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        investmentGoals: e.target.checked
                          ? [...prev.investmentGoals, goal]
                          : prev.investmentGoals.filter((g) => g !== goal),
                      }));
                    }}
                    className="rounded bg-gray-700 border-gray-600 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">{goal}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Delete Client
            </button>
            <div className="flex space-x-3">
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-300 mb-4">
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}