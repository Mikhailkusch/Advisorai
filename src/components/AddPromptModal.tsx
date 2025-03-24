import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PredefinedPrompt } from '../types';

interface AddPromptModalProps {
  onClose: () => void;
  onPromptAdded: (prompt: PredefinedPrompt) => void;
}

export default function AddPromptModal({ onClose, onPromptAdded }: AddPromptModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'general-enquiry' as PredefinedPrompt['category'],
    prompt: '',
    description: '',
    responseType: 'email' as PredefinedPrompt['responseType']
  });

  const validatePrompt = async (description: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { count, error } = await supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true })
        .eq('description', description)
        .eq('user_id', user.id);

      if (error) throw error;
      return count === 0;
    } catch (error) {
      console.error('Error checking prompt:', error);
      throw new Error('Failed to validate prompt');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const isPromptAvailable = await validatePrompt(formData.description);
      if (!isPromptAvailable) {
        setError('A prompt with this description already exists in your account');
        setIsSubmitting(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('prompts')
        .insert([{
          category: formData.category,
          prompt: formData.prompt,
          description: formData.description,
          response_type: formData.responseType
        }])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A prompt with this description already exists in your account');
          return;
        }
        throw insertError;
      }

      if (data) {
        onPromptAdded({
          id: data.id,
          category: data.category,
          prompt: data.prompt,
          description: data.description,
          responseType: data.response_type
        });
        onClose();
      }
    } catch (error) {
      console.error('Error adding prompt:', error);
      setError('Failed to add prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Add New Prompt</h2>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Response Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={formData.responseType === 'email'}
                  onChange={(e) => setFormData(prev => ({ ...prev, responseType: e.target.value as 'email' | 'proposal' }))}
                  className="form-radio text-primary-500 focus:ring-primary-500 bg-gray-700 border-gray-600"
                />
                <span className="ml-2 text-gray-300">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="proposal"
                  checked={formData.responseType === 'proposal'}
                  onChange={(e) => setFormData(prev => ({ ...prev, responseType: e.target.value as 'email' | 'proposal' }))}
                  className="form-radio text-primary-500 focus:ring-primary-500 bg-gray-700 border-gray-600"
                />
                <span className="ml-2 text-gray-300">Proposal</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">
              Category
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as PredefinedPrompt['category'] }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="tax-planning">Tax Planning</option>
              <option value="risk-planning">Risk Planning</option>
              <option value="estate-planning">Estate Planning</option>
              <option value="offshore-investment">Offshore Investment</option>
              <option value="retirement-planning">Retirement Planning</option>
              <option value="investment-planning">Investment Planning</option>
              <option value="general-enquiry">General Enquiry</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
              Description
            </label>
            <input
              type="text"
              id="description"
              required
              value={formData.description}
              onChange={(e) => {
                setError(null);
                setFormData(prev => ({ ...prev, description: e.target.value }));
              }}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Brief description of the prompt"
            />
          </div>
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
              Prompt Template
            </label>
            <textarea
              id="prompt"
              required
              rows={4}
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
              placeholder="Enter the prompt template..."
            />
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
              {isSubmitting ? 'Adding...' : 'Add Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}