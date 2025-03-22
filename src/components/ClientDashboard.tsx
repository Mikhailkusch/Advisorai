import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Client, AIResponse } from '../types';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import type { ClientDocument } from '../types';
import ClientSummary from './ClientSummary';

interface ClientNote {
  id: string;
  content: string;
  created_at: string;
}

interface ClientTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
}

function formatDate(date: string | Date | null): string {
  if (!date) return 'Not specified';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return format(d, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
}

export default function ClientDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [showAddTask, setShowAddTask] = useState(false);

  // Editing states for notes
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);
  const [editedNoteContent, setEditedNoteContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<ClientNote | null>(null);
  const [showDeleteNoteDialog, setShowDeleteNoteDialog] = useState(false);

  // Editing states for tasks
  const [editingTask, setEditingTask] = useState<ClientTask | null>(null);
  const [editedTask, setEditedTask] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [taskToDelete, setTaskToDelete] = useState<ClientTask | null>(null);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error('Client not found');

      setClient({
        id: clientData.id,
        name: clientData.name,
        surname: clientData.surname,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        occupation: clientData.occupation,
        portfolioValue: clientData.portfolio_value,
        riskProfile: clientData.risk_profile,
        status: clientData.status,
        lastContact: new Date(clientData.last_contact),
        annualIncome: clientData.annual_income,
        investmentGoals: clientData.investment_goals,
        riskTolerance: clientData.risk_tolerance,
        preferredContactMethod: clientData.preferred_contact_method
      });

      // Fetch client notes
      const { data: notesData, error: notesError } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch client tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', id)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch client responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

      // Fetch client documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', id)
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

    } catch (error) {
      console.error('Error fetching client data:', error);
      setError('Failed to load client data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('client_notes')
        .insert([{
          client_id: id,
          content: newNote
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note. Please try again.');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.due_date) return;

    try {
      const { data, error } = await supabase
        .from('client_tasks')
        .insert([{
          client_id: id,
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data]);
      setNewTask({ title: '', description: '', due_date: '' });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: ClientTask['status']) => {
    try {
      const { error } = await supabase
        .from('client_tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !editedNoteContent.trim()) return;

    try {
      const { data, error } = await supabase
        .from('client_notes')
        .update({ content: editedNoteContent })
        .eq('id', editingNote.id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === editingNote.id ? data : note
      ));
      setEditingNote(null);
      setEditedNoteContent('');
    } catch (error: unknown) {
      console.error('Error updating note:', error);
      setError('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteToDelete.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
      setNoteToDelete(null);
      setShowDeleteNoteDialog(false);
    } catch (error: unknown) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note. Please try again.');
    }
  };

  // Effect to set edited content when a note is selected for editing
  useEffect(() => {
    if (editingNote) {
      setEditedNoteContent(editingNote.content);
    }
  }, [editingNote]);

  const handleEditTask = async () => {
    if (!editingTask || !editedTask.title.trim() || !editedTask.due_date) return;

    try {
      const { data, error } = await supabase
        .from('client_tasks')
        .update({
          title: editedTask.title,
          description: editedTask.description,
          due_date: editedTask.due_date
        })
        .eq('id', editingTask.id)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? data : task
      ));
      setEditingTask(null);
      setEditedTask({ title: '', description: '', due_date: '' });
    } catch (error: unknown) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const { error } = await supabase
        .from('client_tasks')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));
      setTaskToDelete(null);
      setShowDeleteTaskDialog(false);
    } catch (error: unknown) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Effect to set edited task content when a task is selected for editing
  useEffect(() => {
    if (editingTask) {
      setEditedTask({
        title: editingTask.title,
        description: editingTask.description || '',
        due_date: editingTask.due_date
      });
    }
  }, [editingTask]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="text-gray-100">Loading client data...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || 'Client not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard', { state: { selectedTab: 'clients' } })}
            className="flex items-center text-gray-400 hover:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Clients
          </button>
          <button
            onClick={fetchClientData}
            className="p-2 text-gray-400 hover:text-gray-300"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">
                    {client.name} {client.surname}
                  </h1>
                  <p className="text-gray-400">{client.occupation}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.status === 'active'
                    ? 'bg-green-900/50 text-green-200'
                    : client.status === 'pending'
                    ? 'bg-yellow-900/50 text-yellow-200'
                    : 'bg-red-900/50 text-red-200'
                }`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-5 h-5 mr-2 text-gray-400" />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center text-gray-300">
                    <Phone className="w-5 h-5 mr-2 text-gray-400" />
                    {client.phone}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center text-gray-300 md:col-span-2">
                    <User className="w-5 h-5 mr-2 text-gray-400" />
                    {client.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Financial Overview</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Portfolio Value</label>
                <p className="text-xl font-semibold text-gray-100">
                  R{client.portfolioValue.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Risk Profile</label>
                <p className="text-gray-100 capitalize">{client.riskProfile}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Risk Tolerance</label>
                <p className="text-gray-100">{client.riskTolerance}/10</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Annual Income</label>
                <p className="text-gray-100">
                  R{client.annualIncome?.toLocaleString() || 'Not specified'}
                </p>
              </div>
              {client.investmentGoals && client.investmentGoals.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400">Investment Goals</label>
                  <div className="mt-1 space-y-1">
                    {client.investmentGoals.map((goal, index) => (
                      <p key={index} className="text-gray-100">{goal}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Client Summary */}
        <div className="mb-8">
          <ClientSummary
            client={client}
            notes={notes}
            responses={responses}
            tasks={tasks}
            onError={setError}
          />
        </div>

        {/* Notes and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Notes Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new note..."
                className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-gray-700 rounded-lg p-4">
                  {editingNote?.id === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedNoteContent}
                        onChange={(e) => setEditedNoteContent(e.target.value)}
                        className="w-full h-24 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleEditNote}
                          disabled={!editedNoteContent.trim()}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setEditedNoteContent('');
                          }}
                          className="px-3 py-1 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-100 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-400">
                          {formatDate(note.created_at)}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingNote(note)}
                            className="p-1 text-gray-400 hover:text-gray-300"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setNoteToDelete(note);
                              setShowDeleteNoteDialog(true);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delete Note Confirmation Dialog */}
          {showDeleteNoteDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Delete Note</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDeleteNote}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setNoteToDelete(null);
                      setShowDeleteNoteDialog(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Tasks</h2>
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>

            {showAddTask && (
              <div className="mb-6 bg-gray-700 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-24 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddTask(false)}
                      className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTask}
                      disabled={!newTask.title || !newTask.due_date}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-gray-700 rounded-lg p-4">
                  {editingTask?.id === task.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editedTask.title}
                          onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editedTask.description}
                          onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full h-24 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={editedTask.due_date}
                          onChange={(e) => setEditedTask(prev => ({ ...prev, due_date: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleEditTask}
                          disabled={!editedTask.title.trim() || !editedTask.due_date}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(null);
                            setEditedTask({ title: '', description: '', due_date: '' });
                          }}
                          className="px-3 py-1 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-gray-100 font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-300 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            {task.due_date ? format(new Date(task.due_date), 'h:mm a') : 'No time set'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as ClientTask['status'])}
                          className="px-2 py-1 bg-gray-600 border border-gray-500 rounded-md text-gray-100 text-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1 text-gray-400 hover:text-gray-300"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task);
                            setShowDeleteTaskDialog(true);
                          }}
                          className="p-1 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delete Task Confirmation Dialog */}
          {showDeleteTaskDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Delete Task</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDeleteTask}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setTaskToDelete(null);
                      setShowDeleteTaskDialog(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Documents</h2>
          <div className="space-y-6">
            <DocumentUpload
              clientId={id!}
              onDocumentUploaded={(doc) => setDocuments(prev => [doc, ...prev])}
            />
            <DocumentList
              documents={documents}
              onDocumentDeleted={(docId) => setDocuments(prev => prev.filter(d => d.id !== docId))}
            />
          </div>
        </div>

        {/* Responses Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Responses</h2>
          <div className="space-y-4">
            {responses.map((response) => (
              <div key={response.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-100 font-medium">{response.summary}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    response.status === 'pending'
                      ? 'bg-yellow-900/50 text-yellow-200'
                      : response.status === 'approved'
                      ? 'bg-green-900/50 text-green-200'
                      : 'bg-red-900/50 text-red-200'
                  }`}>
                    {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{response.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {formatDate(response.createdAt)}
                  </span>
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {response.category.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}