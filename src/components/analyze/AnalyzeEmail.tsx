import React, { useState } from 'react';
import type { EmailAnalysis, Client } from '../../types';
import { analyzeEmail } from '../../lib/openai';
import { supabase } from '../../lib/supabase';

interface AnalyzeEmailProps {
  onProceedToResponse: (analysis: EmailAnalysis) => void;
}

export default function AnalyzeEmail({ onProceedToResponse }: AnalyzeEmailProps) {
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrGetClient = async (senderEmail: string | null, senderName: string | null): Promise<Client | null> => {
    if (!senderEmail) return null;

    // Try to find existing client
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', senderEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }

    if (existingClient) {
      return existingClient;
    }

    // Create new client if none exists
    const [firstName, ...lastNameParts] = (senderName || 'Unknown').split(' ');
    const lastName = lastNameParts.join(' ');

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert([{
        name: firstName,
        surname: lastName,
        email: senderEmail,
        status: 'pending',
        portfolioValue: 0,
        riskProfile: 'moderate',
        lastContact: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return newClient;
  };

  const storeAnalysis = async (analysis: EmailAnalysis, clientId: string) => {
    const { error: analysisError } = await supabase
      .from('email_analyses')
      .insert([{
        client_id: clientId,
        email_summary: analysis.email_summary,
        sender_details: analysis.sender_details,
        email_intent: analysis.email_intent,
        key_topics: analysis.key_topics,
        specific_questions: analysis.specific_questions,
        attached_documents: analysis.attached_documents,
        recommended_response: analysis.recommended_response,
        created_at: new Date().toISOString()
      }]);

    if (analysisError) throw analysisError;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!context) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeEmail(context);
      setAnalysis(result);

      // Create or get client based on sender details
      const client = await createOrGetClient(
        result.sender_details.email,
        result.sender_details.name
      );

      if (client) {
        // Store the analysis in the database
        await storeAnalysis(result, client.id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze email');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-700"
    >
      <h2 className="text-lg font-medium text-gray-100 mb-4">Analyze Email Content</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-300">
            Email Content
          </label>
          <textarea
            id="context"
            rows={6}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Paste email content here..."
          />
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={isAnalyzing || !context}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
          aria-label="Analyze email content"
          style={{ cursor: context && !isAnalyzing ? 'pointer' : 'not-allowed' }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-900 text-red-100 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-100 mb-3">Analysis Results</h3>
            <div className="bg-gray-700 rounded-md p-4">
              <pre className="text-sm text-gray-200 overflow-auto">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => onProceedToResponse(analysis)}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Proceed to Response Generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 