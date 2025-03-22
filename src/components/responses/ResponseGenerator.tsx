import React, { useState } from 'react';
import { Send } from 'lucide-react';
import type { Client, PredefinedPrompt, AIResponseRequest } from '../../types';
import SearchableDropdown from '../SearchableDropdown';

interface ResponseGeneratorProps {
  clients: Client[];
  prompts: PredefinedPrompt[];
  onGenerate: (request: AIResponseRequest) => Promise<void>;
  isGenerating: boolean;
}

export default function ResponseGenerator({ clients, prompts, onGenerate, isGenerating }: ResponseGeneratorProps) {
  const [request, setRequest] = useState<AIResponseRequest>({
    clientId: '',
    category: 'general-advice',
    prompt: '',
    context: '',
    responseType: 'email'
  });
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
    const selectedPrompt = prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      setRequest(prev => ({
        ...prev,
        prompt: selectedPrompt.prompt,
        category: selectedPrompt.category,
        responseType: selectedPrompt.responseType
      }));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-700">
      <h2 className="text-lg font-medium text-gray-100 mb-4">Generate New Response</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Response Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="email"
                checked={request.responseType === 'email'}
                onChange={(e) => setRequest(prev => ({ ...prev, responseType: e.target.value as 'email' | 'proposal' }))}
                className="form-radio text-primary-500 focus:ring-primary-500 bg-gray-700 border-gray-600"
              />
              <span className="ml-2 text-gray-300">Email</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="proposal"
                checked={request.responseType === 'proposal'}
                onChange={(e) => setRequest(prev => ({ ...prev, responseType: e.target.value as 'email' | 'proposal' }))}
                className="form-radio text-primary-500 focus:ring-primary-500 bg-gray-700 border-gray-600"
              />
              <span className="ml-2 text-gray-300">Proposal</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-300">
            Select Client
          </label>
          <SearchableDropdown
            options={clients.map(client => ({
              id: client.id,
              label: `${client.name} (${client.email})`
            }))}
            value={request.clientId}
            onChange={(value) => setRequest(prev => ({ ...prev, clientId: value }))}
            placeholder="Select a client..."
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            id="category"
            value={request.category}
            onChange={(e) => setRequest(prev => ({ ...prev, category: e.target.value as AIResponseRequest['category'] }))}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="general-advice">General Advice</option>
            <option value="investment-update">Investment Update</option>
            <option value="tax-planning">Tax Planning</option>
            <option value="onboarding">Onboarding</option>
          </select>
        </div>

        <div>
          <label htmlFor="predefinedPrompt" className="block text-sm font-medium text-gray-300">
            Select Prompt
          </label>
          <SearchableDropdown
            options={prompts
              .filter(prompt => prompt.responseType === request.responseType)
              .map(prompt => ({
                id: prompt.id,
                label: prompt.description
              }))}
            value={selectedPromptId}
            onChange={handlePromptSelect}
            placeholder="Select a prompt..."
          />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-300">
            Context
          </label>
          <textarea
            id="context"
            rows={4}
            value={request.context}
            onChange={(e) => setRequest(prev => ({ ...prev, context: e.target.value }))}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            placeholder="Enter additional context about the client's situation..."
          />
        </div>

        <button
          onClick={() => onGenerate(request)}
          disabled={isGenerating || !request.clientId || !request.prompt || !request.context}
          className="flex items-center justify-center w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            'Generating...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Generate Response
            </>
          )}
        </button>
      </div>
    </div>
  );
}