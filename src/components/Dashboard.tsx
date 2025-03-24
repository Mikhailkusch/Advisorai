import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Upload, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { generateAIResponse } from '../lib/openai';
import type { AIResponseRequest, AIResponse, Client, PredefinedPrompt } from '../types';
import { supabase } from '../lib/supabase';

// Layout Components
import DashboardLayout from './layout/DashboardLayout';
import TabNavigation from './navigation/TabNavigation';
import SearchBar from './navigation/SearchBar';

// Feature Components
import AddClientModal from './AddClientModal';
import AddPromptModal from './AddPromptModal';
import EditClientModal from './EditClientModal';
import EditPromptModal from './EditPromptModal';
import EditResponseModal from './EditResponseModal';
import EmailList from './EmailList';
import ImportClientsModal from './ImportClientsModal';
import ResponseGenerator from './responses/ResponseGenerator';
import ProposalCard from './ProposalCard';

// Error Boundary Component
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-center">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-2">
              We encountered an error while loading the dashboard:
            </p>
            <p className="text-red-400 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Dashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // State Management
  const [selectedTab, setSelectedTab] = useState<'responses' | 'clients' | 'emails' | 'prompts' | 'proposals'>(
    (location.state as { selectedTab?: 'responses' | 'clients' | 'emails' | 'prompts' | 'proposals' })?.selectedTab || 'responses'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PredefinedPrompt | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [prompts, setPrompts] = useState<PredefinedPrompt[]>([]);
  const [editingResponse, setEditingResponse] = useState<AIResponse | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<PredefinedPrompt[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<AIResponse[]>([]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchClients(),
          fetchPrompts(),
          fetchResponses()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Data Fetching Functions
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) throw error;

    if (data) {
      setClients(data.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        lastContact: new Date(client.last_contact),
        status: client.status,
        portfolioValue: client.portfolio_value,
        riskProfile: client.risk_profile,
      })));
    }
  };

  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data) {
      setPrompts(data.map(prompt => ({
        id: prompt.id,
        category: prompt.category,
        prompt: prompt.prompt,
        description: prompt.description,
        responseType: prompt.response_type
      })));
    }
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false })
      .neq('status', 'rejected')
      .limit(10);

    if (error) throw error;

    if (data) {
      setResponses(data.map(response => ({
        id: response.id,
        clientId: response.client_id,
        summary: response.summary,
        content: response.content,
        status: response.status,
        createdAt: new Date(response.created_at),
        category: response.category,
        missingInfo: response.missing_info || [],
        responseType: response.response_type
      })));
    }
  };

  // Event Handlers
  const handleGenerateResponse = async (request: AIResponseRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const client = clients.find(c => c.id === request.clientId);
      if (!client) throw new Error('Client not found');

      const clientContext = `Client Name: ${client.name}
Risk Profile: ${client.riskProfile}
Portfolio Value: R${client.portfolioValue.toLocaleString()}
Additional Context: ${request.context}`;
      
      const generatedResponse = await generateAIResponse(
        request.prompt,
        clientContext,
        request.responseType
      );
      
      const { data, error } = await supabase
        .from('responses')
        .insert([{
          client_id: request.clientId,
          summary: generatedResponse.summary,
          content: generatedResponse.emailResponse,
          status: 'pending',
          category: generatedResponse.category,
          missing_info: generatedResponse.missingInfo,
          response_type: request.responseType
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newResponse: AIResponse = {
          id: data.id,
          clientId: data.client_id,
          summary: data.summary,
          content: data.content,
          status: data.status,
          createdAt: new Date(data.created_at),
          category: data.category,
          missingInfo: data.missing_info,
          responseType: data.response_type
        };

        setResponses(prev => [newResponse, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const searchTerm = query.toLowerCase().trim();

    // Filter clients
    const matchingClients = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      client.status.toLowerCase().includes(searchTerm) ||
      client.riskProfile.toLowerCase().includes(searchTerm)
    );
    setFilteredClients(matchingClients);

    // Filter prompts
    const matchingPrompts = prompts.filter(prompt =>
      prompt.description.toLowerCase().includes(searchTerm) ||
      prompt.category.toLowerCase().includes(searchTerm)
    );
    setFilteredPrompts(matchingPrompts);

    // Filter responses
    const matchingResponses = responses.filter(response =>
      response.summary?.toLowerCase().includes(searchTerm) ||
      response.content?.toLowerCase().includes(searchTerm) ||
      response.category?.toLowerCase().includes(searchTerm) ||
      clients.find(c => c.id === response.clientId)?.name.toLowerCase().includes(searchTerm)
    );
    setFilteredResponses(matchingResponses);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // First delete associated responses
      const { error: responsesError } = await supabase
        .from('responses')
        .delete()
        .in('client_id', Array.from(selectedClients));

      if (responsesError) throw responsesError;

      // Then delete the clients
      const { error: clientsError } = await supabase
        .from('clients')
        .delete()
        .in('id', Array.from(selectedClients));

      if (clientsError) throw clientsError;

      setClients(prev => prev.filter(client => !selectedClients.has(client.id)));
      setSelectedClients(new Set());
      setShowDeleteConfirm(false);
      setIsBulkEditMode(false);
    } catch (error) {
      console.error('Error deleting clients:', error);
      setError('Failed to delete selected clients. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClientsImported = (importedClients: Client[]) => {
    setClients(prev => [...prev, ...importedClients]);
    setShowImportModal(false);
  };

  // Render Functions
  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-md mb-6">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    const displayedClients = searchQuery ? filteredClients : clients;
    const displayedPrompts = searchQuery ? filteredPrompts : prompts;
    const displayedResponses = searchQuery ? filteredResponses : responses;

    switch (selectedTab) {
      case 'emails':
        return <EmailList />;
      
      case 'prompts':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-100">
                Saved Prompts {searchQuery && `(${displayedPrompts.length} results)`}
              </h2>
              <button
                onClick={() => setShowAddPromptModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Prompt
              </button>
            </div>

            {displayedPrompts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? 'No prompts match your search.' : 'No prompts found.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayedPrompts.map((prompt) => (
                  <div key={prompt.id} className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-100">{prompt.description}</h3>
                        <p className="text-sm text-gray-400 capitalize">{prompt.category.replace('-', ' ')}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          prompt.responseType === 'email'
                            ? 'bg-blue-900/50 text-blue-200'
                            : 'bg-purple-900/50 text-purple-200'
                        }`}>
                          {prompt.responseType.charAt(0).toUpperCase() + prompt.responseType.slice(1)}
                        </span>
                        <button
                          onClick={() => setEditingPrompt(prompt)}
                          className="p-2 text-gray-400 hover:text-gray-300"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{prompt.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'proposals':
        return (
          <>
            <ResponseGenerator
              clients={displayedClients}
              prompts={displayedPrompts.filter(p => p.responseType === 'proposal')}
              onGenerate={handleGenerateResponse}
              isGenerating={isGenerating}
            />

            {displayedResponses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? 'No proposals match your search.' : 'No proposals found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedResponses
                  .filter(response => response.responseType === 'proposal')
                  .map((response) => {
                    const client = clients.find((c) => c.id === response.clientId);
                    return (
                      <ProposalCard
                        key={response.id}
                        response={response}
                        client={client}
                        onEdit={setEditingResponse}
                        onViewClient={(clientId) => {
                          setSelectedTab('clients');
                          // Additional logic to scroll to or highlight the client
                        }}
                      />
                    );
                  })}
              </div>
            )}
          </>
        );
      
      case 'responses':
        return (
          <>
            <ResponseGenerator
              clients={displayedClients}
              prompts={displayedPrompts.filter(p => p.responseType === 'email')}
              onGenerate={handleGenerateResponse}
              isGenerating={isGenerating}
            />

            {displayedResponses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? 'No responses match your search.' : 'No responses found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedResponses
                  .filter(response => response.responseType === 'email')
                  .map((response) => {
                    const client = clients.find((c) => c.id === response.clientId);
                    return (
                      <div key={response.id} className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
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
                        
                        <div className="prose prose-invert max-w-none mb-4">
                          <div className="whitespace-pre-wrap text-gray-300">{response.content}</div>
                        </div>
                        
                        {response.missingInfo.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Missing Information:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-400">
                              {response.missingInfo.map((info, index) => (
                                <li key={index}>{info}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex space-x-4">
                          <button
                            onClick={() => {
                              const updatedResponse = { ...response, status: 'approved' as const };
                              setResponses(prev =>
                                prev.map(r => r.id === response.id ? updatedResponse : r)
                              );
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setEditingResponse(response)}
                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setResponses(prev => prev.filter(r => r.id !== response.id));
                            }}
                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        );
      
      default: // Clients tab
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium text-gray-100">
                  Clients {searchQuery && `(${displayedClients.length} results)`}
                </h2>
                {displayedClients.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsBulkEditMode(!isBulkEditMode)}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 flex items-center"
                    >
                      {isBulkEditMode ? 'Cancel' : 'Bulk Edit'}
                    </button>
                    {isBulkEditMode && selectedClients.size > 0 && (
                      <button
                        onClick={() => {
                          setDeleteConfirmText('');
                          setShowDeleteConfirm(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{selectedClients.size}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Clients
                </button>
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </button>
              </div>
            </div>

            {displayedClients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? 'No clients match your search.' : 'No clients found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      if (isBulkEditMode) {
                        setSelectedClients(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(client.id)) {
                            newSet.delete(client.id);
                          } else {
                            newSet.add(client.id);
                          }
                          return newSet;
                        });
                      } else {
                        navigate(`/clients/${client.id}`);
                      }
                    }}
                    className={`bg-gray-800 rounded-lg shadow-md p-6 border ${
                      selectedClients.has(client.id) ? 'border-primary-500' : 'border-gray-700'
                    } ${isBulkEditMode ? 'cursor-pointer' : 'hover:border-primary-500 cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-100">{client.name}</h3>
                        <p className="text-sm text-gray-400">{client.email}</p>
                      </div>
                      {!isBulkEditMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            setEditingClient(client);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-300"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      )}
                      {isBulkEditMode && (
                        <div className={`w-5 h-5 rounded ${
                          selectedClients.has(client.id)
                            ? 'bg-primary-500 text-white'
                            : 'border-2 border-gray-500'
                        } flex items-center justify-center`}>
                          {selectedClients.has(client.id) && <Check className="w-4 h-4" />}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Portfolio Value</span>
                        <span className="text-sm font-medium text-gray-100">
                          R{client.portfolioValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Risk Profile</span>
                        <span className="text-sm font-medium text-gray-100">
                          {client.riskProfile.charAt(0).toUpperCase() + client.riskProfile.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Last Contact</span>
                        <span className="text-sm font-medium text-gray-100">
                          {format(client.lastContact, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Status</span>
                        <span className={`text-sm font-medium ${
                          client.status === 'active'
                            ? 'text-green-400'
                            : client.status === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  if (!user) {
    return null; // Let the useEffect handle the redirect
  }

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading dashboard data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardLayout 
        user={user}
        onAddNew={(type) => {
          if (type === 'client') {
            setShowAddClientModal(true);
          } else if (type === 'prompt') {
            setShowAddPromptModal(true);
          }
        }}
        onShowImport={() => setShowImportModal(true)}
      >
        {/* Add Client Modal */}
        {showAddClientModal && (
          <AddClientModal
            onClose={() => setShowAddClientModal(false)}
            onClientAdded={(client) => {
              setClients(prev => [...prev, client]);
              setShowAddClientModal(false);
            }}
          />
        )}
        
        {/* Add Prompt Modal */}
        {showAddPromptModal && (
          <AddPromptModal
            onClose={() => setShowAddPromptModal(false)}
            onPromptAdded={(prompt) => {
              setPrompts(prev => [prompt, ...prev]);
              setShowAddPromptModal(false);
            }}
          />
        )}

        {/* Import Clients Modal */}
        {showImportModal && (
          <ImportClientsModal
            onClose={() => setShowImportModal(false)}
            onClientsImported={handleClientsImported}
          />
        )}

        {/* Rest of the dashboard content */}
        <div className="space-y-6">
          <TabNavigation
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
          <SearchBar onSearch={handleSearch} />
          {renderContent()}
        </div>
      </DashboardLayout>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border border-gray-700">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-300 mb-4">
              Are you sure you want to delete {selectedClients.size} {selectedClients.size === 1 ? 'client' : 'clients'}? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-300 mb-2">
                Type "confirm" to proceed
              </label>
              <input
                type="text"
                id="confirmDelete"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type 'confirm' here"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting || deleteConfirmText !== 'confirm'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardErrorBoundary>
  );
}