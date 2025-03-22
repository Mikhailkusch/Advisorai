import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PredefinedPrompt } from '../types';

interface EditPromptModalProps {
  prompt: PredefinedPrompt;
  onClose: () => void;
  onPromptUpdated: (prompt: PredefinedPrompt) => void;
  onPromptDeleted: (promptId: string) => void;
}

export default function EditPromptModal({ prompt, onClose, onPromptUpdated, onPromptDeleted }: EditPromptModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: prompt.category,
    prompt: prompt.prompt,
    description: prompt.description,
    responseType: prompt.responseType
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('prompts')
        .update({
          category: formData.category,
          prompt: formData.prompt,
          description: formData.description,
          response_type: formData.responseType
        })
        .eq('id', prompt.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onPromptUpdated({
          id: data.id,
          category: data.category,
          prompt: data.prompt,
          description: data.description,
          responseType: data.response_type
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError('Failed to update prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id);

      if (error) throw error;

      onPromptDeleted(prompt.id);
      onClose();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setError('Failed to delete prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Edit Prompt</h2>
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
              <option value="general-advice">General Advice</option>
              <option value="investment-update">Investment Update</option>
              <option value="tax-planning">Tax Planning</option>
              <option value="onboarding">Onboarding</option>
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
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
          <div className="flex justify-between space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Delete Prompt
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
                Are you sure you want to delete this prompt? This action cannot be undone.
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