import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ClientDocument } from '../types';

interface DocumentUploadProps {
  clientId: string;
  onDocumentUploaded: (document: ClientDocument) => void;
}

export default function DocumentUpload({ clientId, onDocumentUploaded }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      // First check if the bucket exists, if not, show a helpful error
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) throw bucketsError;

      const bucketExists = buckets?.some(bucket => bucket.name === 'client-documents');
      if (!bucketExists) {
        throw new Error(
          'Storage bucket not found. Please ensure the storage bucket "client-documents" exists in your Supabase project.'
        );
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      // Create document record in the database
      const { data: documentData, error: dbError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onDocumentUploaded(documentData);
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to upload document. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
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

  return (
    <div>
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="hidden"
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4 flex flex-col items-center text-sm leading-6 text-gray-400">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="relative cursor-pointer rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-100 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload document'}
            </button>
            <p className="pl-1 pt-2">or drag and drop</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-900/50 text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}