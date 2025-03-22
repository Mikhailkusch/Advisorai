import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AIResponse } from '../types';

interface EditResponseModalProps {
  response: AIResponse;
  onClose: () => void;
  onSave: (updatedResponse: AIResponse) => void;
}

export default function EditResponseModal({ response, onClose, onSave }: EditResponseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedResponse, setEditedResponse] = useState({
    summary: response.summary,
    content: response.content,
    missingInfo: response.missingInfo || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('responses')
        .update({
          summary: editedResponse.summary,
          content: editedResponse.content,
          missing_info: editedResponse.missingInfo
        })
        .eq('id', response.id);

      if (error) throw error;

      onSave({
        ...response,
        summary: editedResponse.summary,
        content: editedResponse.content,
        missingInfo: editedResponse.missingInfo
      });
    } catch (error) {
      console.error('Error updating response:', error);
      setError('Failed to update response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Edit Response</h2>
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
            <label htmlFor="summary" className="block text-sm font-medium text-gray-300">
              Summary
            </label>
            <input
              type="text"
              id="summary"
              value={editedResponse.summary}
              onChange={(e) => setEditedResponse(prev => ({ ...prev, summary: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300">
              Content
            </label>
            <textarea
              id="content"
              rows={8}
              value={editedResponse.content}
              onChange={(e) => setEditedResponse(prev => ({ ...prev, content: e.target.value }))}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Missing Information
            </label>
            {editedResponse.missingInfo.map((info, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={info}
                  onChange={(e) => {
                    const newMissingInfo = [...editedResponse.missingInfo];
                    newMissingInfo[index] = e.target.value;
                    setEditedResponse(prev => ({ ...prev, missingInfo: newMissingInfo }));
                  }}
                  className="flex-1 rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMissingInfo = editedResponse.missingInfo.filter((_, i) => i !== index);
                    setEditedResponse(prev => ({ ...prev, missingInfo: newMissingInfo }));
                  }}
                  className="p-2 text-gray-400 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setEditedResponse(prev => ({
                  ...prev,
                  missingInfo: [...prev.missingInfo, '']
                }));
              }}
              className="mt-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
            >
              Add Missing Information
            </button>
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}