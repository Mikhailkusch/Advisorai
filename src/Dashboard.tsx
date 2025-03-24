import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, Mail, Bell, Settings, ChevronDown, Search, Send, Plus, Pencil } from 'lucide-react';
import { mockResponses } from '../data';
import { generateAIResponse } from '../lib/openai';
import { AIResponseRequest, AIResponse, Client, PredefinedPrompt } from '../types';
import { supabase } from '../lib/supabase';
import AddClientModal from './AddClientModal';
import AddPromptModal from './AddPromptModal';
import EditResponseModal from './EditResponseModal';
import EmailList from './EmailList';
import EditPromptModal from './EditPromptModal';

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<'responses' | 'clients' | 'emails' | 'prompts'>('responses');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responses, setResponses] = useState<AIResponse[]>(mockResponses);
  const [showAddNewMenu, setShowAddNewMenu] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PredefinedPrompt | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [prompts, setPrompts] = useState<PredefinedPrompt[]>([]);
  const [editingResponse, setEditingResponse] = useState<AIResponse | null>(null);
  const [newResponse, setNewResponse] = useState<AIResponseRequest>({
    clientId: '',
    category: 'general-enquiry',
    prompt: '',
    context: '',
    responseType: 'email'
  });

  useEffect(() => {
    fetchClients();
    fetchPrompts();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        const formattedClients: Client[] = data.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          lastContact: new Date(client.last_contact),
          status: client.status,
          portfolioValue: client.portfolio_value,
          riskProfile: client.risk_profile,
        }));
        setClients(formattedClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('id, category, prompt, description, response_type')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedPrompts: PredefinedPrompt[] = data.map(prompt => ({
          id: prompt.id,
          category: prompt.category,
          prompt: prompt.prompt,
          description: prompt.description,
          responseType: prompt.response_type
        }));
        setPrompts(formattedPrompts);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const handlePromptSelect = (promptId: string) => {
    const selectedPrompt = prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      setNewResponse(prev => ({
        ...prev,
        prompt: selectedPrompt.prompt,
        category: selectedPrompt.category,
        responseType: selectedPrompt.responseType
      }));
    }
  };

  const handleGenerateResponse = async () => {
    if (!newResponse.clientId || !newResponse.prompt || !newResponse.context) return;

    setIsGenerating(true);
    try {
      const client = clients.find(c => c.id === newResponse.clientId);
      const clientContext = `Client Name: ${client?.name}
Risk Profile: ${client?.riskProfile}
Portfolio Value: $${client?.portfolioValue.toLocaleString()}
Additional Context: ${newResponse.context}`;
      
      const generatedContent = await generateAIResponse(newResponse.prompt, clientContext);
      
      const newResponseObj: AIResponse = {
        id: (responses.length + 1).toString(),
        clientId: newResponse.clientId,
        subject: newResponse.prompt.slice(0, 50) + (newResponse.prompt.length > 50 ? '...' : ''),
        content: generatedContent,
        status: 'pending',
        createdAt: new Date(),
        category: newResponse.category
      };

      setResponses(prev => [newResponseObj, ...prev]);

      setNewResponse({
        clientId: '',
        category: 'general-enquiry',
        prompt: '',
        context: '',
        responseType: 'email'
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddNew = (type: 'client' | 'prompt') => {
    setShowAddNewMenu(false);
    if (type === 'client') {
      setShowAddClientModal(true);
    } else if (type === 'prompt') {
      setShowAddPromptModal(true);
    }
  };

  const handleClientAdded = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
  };

  const handlePromptAdded = (newPrompt: PredefinedPrompt) => {
    setPrompts(prev => [newPrompt, ...prev]);
  };

  const handlePromptUpdated = (updatedPrompt: PredefinedPrompt) => {
    setPrompts(prev =>
      prev.map(prompt =>
        prompt.id === updatedPrompt.id ? {
          ...prompt,
          category: updatedPrompt.category,
          prompt: updatedPrompt.prompt,
          description: updatedPrompt.description,
          responseType: updatedPrompt.responseType
        } : prompt
      )
    );
  };

  const handlePromptDeleted = (promptId: string) => {
    setPrompts(prev => prev.filter(prompt => prompt.id !== promptId));
  };

  const handleEditResponse = (response: AIResponse) => {
    setEditingResponse(response);
  };

  const handleSaveResponse = (updatedResponse: AIResponse) => {
    setResponses(prev =>
      prev.map(response =>
        response.id === updatedResponse.id ? updatedResponse : response
      )
    );
    setEditingResponse(null);
  };

  // Rest of the component remains the same until the prompts dropdown
  return (
    <div className="min-h-screen bg-gray-50">
      {showAddClientModal && (
        <AddClientModal
          onClose={() => setShowAddClientModal(false)}
          onClientAdded={handleClientAdded}
        />
      )}
      
      {showAddPromptModal && (
        <AddPromptModal
          onClose={() => setShowAddPromptModal(false)}
          onPromptAdded={handlePromptAdded}
        />
      )}
      
      {editingPrompt && (
        <EditPromptModal
          prompt={editingPrompt}
          onClose={() => setEditingPrompt(null)}
          onPromptUpdated={handlePromptUpdated}
          onPromptDeleted={handlePromptDeleted}
        />
      )}
      
      {editingResponse && (
        <EditResponseModal
          response={editingResponse}
          onClose={() => setEditingResponse(null)}
          onSave={handleSaveResponse}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-semibold text-gray-900">AI Advisor Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Add New Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAddNewMenu(!showAddNewMenu)}
                  className="p-2 text-gray-400 hover:text-gray-500 flex items-center"
                >
                  <Plus className="h-6 w-6" />
                </button>
                {showAddNewMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => handleAddNew('client')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Add New Client
                      </button>
                      <button
                        onClick={() => handleAddNew('prompt')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Add New Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile"
                />
                <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients, responses, or categories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('responses')}
              className={`${
                selectedTab === 'responses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              AI Responses
            </button>
            <button
              onClick={() => setSelectedTab('clients')}
              className={`${
                selectedTab === 'clients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Clients
            </button>
            <button
              onClick={() => setSelectedTab('prompts')}
              className={`${
                selectedTab === 'prompts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Prompts
            </button>
            <button
              onClick={() => setSelectedTab('emails')}
              className={`${
                selectedTab === 'emails'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Emails
            </button>
          </nav>
        </div>

        {/* Content */}
        {selectedTab === 'emails' ? (
          <EmailList />
        ) : selectedTab === 'prompts' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Saved Prompts</h2>
              <button
                onClick={() => setShowAddPromptModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Prompt
              </button>
            </div>

            {prompts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No prompts found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{prompt.description}</h3>
                        <p className="text-sm text-gray-500 capitalize">{prompt.category.replace('-', ' ')}</p>
                      </div>
                      <button
                        onClick={() => setEditingPrompt(prompt)}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{prompt.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedTab === 'responses' ? (
          <>
            {/* New Response Generator */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Generate New Response</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700">
                    Select Client
                  </label>
                  <select
                    id="client"
                    value={newResponse.clientId}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, clientId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newResponse.category}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, category: e.target.value as AIResponse['category'] }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label htmlFor="predefinedPrompt" className="block text-sm font-medium text-gray-700">
                    Select Prompt
                  </label>
                  <select
                    id="predefinedPrompt"
                    onChange={(e) => handlePromptSelect(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a prompt...</option>
                    {prompts.map(prompt => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="context" className="block text-sm font-medium text-gray-700">
                    Context
                  </label>
                  <textarea
                    id="context"
                    rows={4}
                    value={newResponse.context}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, context: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter additional context about the client's situation..."
                  />
                </div>
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                    Selected Prompt
                  </label>
                  <textarea
                    id="prompt"
                    rows={4}
                    value={newResponse.prompt}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, prompt: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    placeholder="Select a predefined prompt or enter your own..."
                    readOnly
                  />
                </div>
                <button
                  onClick={handleGenerateResponse}
                  disabled={isGenerating || !newResponse.clientId || !newResponse.prompt || !newResponse.context}
                  className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
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

            {/* Response List */}
            <div className="space-y-4">
              {responses.map((response) => {
                const client = clients.find((c) => c.id === response.clientId);
                return (
                  <div key={response.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{response.subject}</h3>
                        <p className="text-sm text-gray-500">
                          For: {client?.name} • {format(response.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          response.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : response.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{response.content}</p>
                    <div className="flex space-x-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Approve
                      </button>
                      <button
                        onClick={() => handleEditResponse(response)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={`https://images.unsplash.com/photo-${client.id === '1' ? '1494790108377-be9c29b29330' : client.id === '2' ? '1507003211169-0a1dd7228f2d' : '1438761681033-6461ffad8d80'}?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`}
                    alt={client.name}
                  />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Portfolio Value</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${client.portfolioValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Risk Profile</span>
                    <span className="text-sm font-medium text-gray-900">
                      {client.riskProfile.charAt(0).toUpperCase() + client.riskProfile.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Contact</span>
                    <span className="text-sm font-medium text-gray-900">
                      {format(client.lastContact, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}