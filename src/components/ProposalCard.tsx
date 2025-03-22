import React from 'react';
import { Edit2, User } from 'lucide-react';
import { format } from 'date-fns';
import type { AIResponse, Client } from '../types';

interface ProposalCardProps {
  response: AIResponse;
  client: Client | undefined;
  onEdit: (response: AIResponse) => void;
  onViewClient: (clientId: string) => void;
}

export default function ProposalCard({ response, client, onEdit, onViewClient }: ProposalCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-100">{response.summary}</h3>
          <p className="text-sm text-gray-400">
            For: {client?.name} • {format(response.createdAt, 'MMM d, yyyy')}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            response.status === 'pending'
              ? 'bg-yellow-900/50 text-yellow-200'
              : response.status === 'approved'
              ? 'bg-green-900/50 text-green-200'
              : 'bg-red-900/50 text-red-200'
          }`}
        >
          {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
        </span>
      </div>
      
      <div className="prose prose-invert max-w-none mb-6">
        <div className="whitespace-pre-wrap text-gray-300">{response.content}</div>
      </div>
      
      {response.missingInfo.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Missing Information:</h4>
          <ul className="list-disc list-inside text-sm text-gray-400">
            {response.missingInfo.map((info, index) => (
              <li key={index}>{info}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <button
          onClick={() => onViewClient(response.clientId)}
          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>View Client Info</span>
        </button>
        <button
          onClick={() => onEdit(response)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Proposal</span>
        </button>
      </div>
    </div>
  );
}