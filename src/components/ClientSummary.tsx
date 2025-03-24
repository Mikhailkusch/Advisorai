import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { Client, AIResponse } from '../types';

interface ClientSummaryProps {
  client: Client;
  notes: any[];
  responses: AIResponse[];
  tasks: any[];
  onError: (message: string) => void;
}

interface Summary {
  id: string;
  client_id: string;
  content: string;
  generated_at: string;
}

// Error boundary component to prevent infinite loops
class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/50 text-red-200 rounded-md">
          Error rendering markdown content. Please try regenerating the summary.
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ClientSummary({ client, notes, responses, tasks, onError }: ClientSummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client?.id) {
      fetchLatestSummary();
    }
  }, [client?.id]);

  const fetchLatestSummary = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('client_summaries')
        .select('*')
        .eq('client_id', client.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('Failed to fetch client summary');
      onError('Failed to fetch client summary');
    }
  };

  const handleGenerateSummary = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client,
          notes: notes.slice(0, 10),
          responses: responses.slice(0, 5),
          tasks: tasks.slice(0, 5)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const { summary: newSummary } = await response.json();
      
      const { data, error } = await supabase
        .from('client_summaries')
        .insert({
          client_id: client.id,
          content: newSummary
        })
        .select()
        .single();

      if (error) throw error;

      setSummary(data);
    } catch (error) {
      console.error('Error generating summary:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate client summary');
      onError('Failed to generate client summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const markdownComponents: Components = {
    h1: ({children}) => <h1 className="text-2xl font-bold text-gray-100 mt-6 mb-4">{children}</h1>,
    h2: ({children}) => <h2 className="text-xl font-semibold text-gray-200 mt-4 mb-3">{children}</h2>,
    h3: ({children}) => <h3 className="text-lg font-medium text-gray-300 mt-3 mb-2">{children}</h3>,
    strong: ({children}) => <strong className="text-primary-400 font-semibold">{children}</strong>,
    blockquote: ({children}) => (
      <blockquote className="border-l-4 border-primary-500 pl-4 my-4 text-gray-300 italic">
        {children}
      </blockquote>
    ),
    ul: ({children}) => <ul className="list-disc list-inside space-y-1 text-gray-300">{children}</ul>,
    li: ({children}) => <li className="text-gray-300">{children}</li>,
    // Simplified table components to prevent parsing issues
    table: ({children}) => <div className="overflow-x-auto mt-4 mb-4">{children}</div>,
    thead: ({children}) => <div className="font-semibold bg-gray-700 p-2">{children}</div>,
    tbody: ({children}) => <div className="divide-y divide-gray-700">{children}</div>,
    tr: ({children}) => <div className="flex flex-wrap">{children}</div>,
    td: ({children}) => <div className="flex-1 min-w-[200px] p-2 text-gray-300 break-words">{children}</div>,
    th: ({children}) => <div className="flex-1 min-w-[200px] p-2 text-gray-200 font-semibold">{children}</div>
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-100">Client Summary</h2>
        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate New Summary'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {summary ? (
        <div className="space-y-4">
          <MarkdownErrorBoundary>
            <div className="prose prose-invert prose-headings:text-gray-100 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:text-primary-400 prose-blockquote:border-primary-500 prose-blockquote:text-gray-300 max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
                skipHtml={true}
                unwrapDisallowed={true}
              >
                {summary.content || ''}
              </ReactMarkdown>
            </div>
          </MarkdownErrorBoundary>
          <p className="text-sm text-gray-400">
            Last generated: {new Date(summary.generated_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-400">No summary available. Click the button above to generate one.</p>
      )}
    </div>
  );
}