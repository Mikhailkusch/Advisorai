import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';
import Papa from 'papaparse';

interface ImportClientsModalProps {
  onClose: () => void;
  onClientsImported: (clients: Client[]) => void;
}

interface CSVRow {
  name: string;
  email: string;
  portfolioValue: string;
  riskProfile: string;
}

export default function ImportClientsModal({ onClose, onClientsImported }: ImportClientsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = (row: CSVRow): string[] => {
    const errors: string[] = [];
    
    if (!row.name) errors.push('Name is required');
    if (!row.email) errors.push('Email is required');
    if (!row.email.includes('@')) errors.push('Invalid email format');
    if (!row.portfolioValue) errors.push('Portfolio value is required');
    if (isNaN(parseFloat(row.portfolioValue))) errors.push('Portfolio value must be a number');
    if (!row.riskProfile) errors.push('Risk profile is required');
    if (!['conservative', 'moderate', 'aggressive'].includes(row.riskProfile.toLowerCase())) {
      errors.push('Risk profile must be conservative, moderate, or aggressive');
    }

    return errors;
  };

  const checkExistingEmails = async (emails: string[]): Promise<string[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('email')
        .eq('user_id', user.id)
        .in('email', emails);

      if (error) throw error;

      return data ? data.map(client => client.email) : [];
    } catch (error) {
      console.error('Error checking existing emails:', error);
      throw new Error('Failed to check existing emails');
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as CSVRow[];
        setPreview(rows.slice(0, 5)); // Show first 5 rows as preview
        setError(null);
      },
      error: (error) => {
        setError('Failed to parse CSV file: ' + error.message);
        setSelectedFile(null);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const results = await new Promise<CSVRow[]>((resolve, reject) => {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as CSVRow[]),
          error: reject
        });
      });

      // Validate all rows first
      const errors: { row: number; errors: string[] }[] = [];
      results.forEach((row, index) => {
        const rowErrors = validateRow(row);
        if (rowErrors.length > 0) {
          errors.push({ row: index + 1, errors: rowErrors });
        }
      });

      if (errors.length > 0) {
        setError(`Validation errors found:\n${errors.map(e => 
          `Row ${e.row}: ${e.errors.join(', ')}`
        ).join('\n')}`);
        setIsSubmitting(false);
        return;
      }

      // Check for existing emails
      const emails = results.map(row => row.email);
      const existingEmails = await checkExistingEmails(emails);

      if (existingEmails.length > 0) {
        setError(`The following emails already exist in your account:\n${existingEmails.join('\n')}`);
        setIsSubmitting(false);
        return;
      }

      // Process valid rows
      const clientsToInsert = results.map(row => ({
        name: row.name,
        email: row.email,
        portfolio_value: parseFloat(row.portfolioValue),
        risk_profile: row.riskProfile.toLowerCase(),
        status: 'active' as const,
        last_contact: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('clients')
        .insert(clientsToInsert)
        .select();

      if (error) throw error;

      if (data) {
        const formattedClients: Client[] = data.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          portfolioValue: client.portfolio_value,
          riskProfile: client.risk_profile,
          status: client.status,
          lastContact: new Date(client.last_contact),
        }));

        onClientsImported(formattedClients);
        onClose();
      }
    } catch (error) {
      console.error('Error importing clients:', error);
      setError('Failed to import clients. Please check your CSV file and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Import Clients from CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-300 mb-2">CSV Format Requirements:</h3>
            <ul className="list-disc list-inside text-sm text-gray-400">
              <li>File must be in CSV format</li>
              <li>Required columns: name, email, portfolioValue, riskProfile</li>
              <li>Risk profile must be: conservative, moderate, or aggressive</li>
              <li>Portfolio value must be a number</li>
            </ul>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 flex flex-col items-center text-sm leading-6 text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-600"
                >
                  <span>Upload CSV file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
                <p className="pl-1 pt-2">or drag and drop</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-200 p-4 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <pre className="text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Preview (first 5 rows):</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Portfolio Value</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Risk Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {preview.map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-300">{row.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-300">{row.email}</td>
                        <td className="px-3 py-2 text-sm text-gray-300">{row.portfolioValue}</td>
                        <td className="px-3 py-2 text-sm text-gray-300">{row.riskProfile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isSubmitting || !selectedFile}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? 'Importing...' : 'Import Clients'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}