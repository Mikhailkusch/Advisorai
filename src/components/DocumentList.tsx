import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ClientDocument } from '../types';

interface DocumentListProps {
  documents: ClientDocument[];
  onDocumentDeleted: (documentId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DocumentList({ documents, onDocumentDeleted }: DocumentListProps) {
  const handleDelete = async (documentId: string, fileUrl: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this document?');
    if (!confirmed) return;

    try {
      // Delete from storage
      const filePath = fileUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('client-documents')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      onDocumentDeleted(documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-gray-100">{doc.name}</p>
              <p className="text-sm text-gray-400">
                {formatFileSize(doc.file_size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={doc.file_url}
              download
              className="p-2 text-gray-400 hover:text-gray-300"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={() => handleDelete(doc.id, doc.file_url)}
              className="p-2 text-gray-400 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}