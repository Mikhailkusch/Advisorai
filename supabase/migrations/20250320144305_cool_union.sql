/*
  # Fix storage bucket setup

  1. Changes
    - Create storage bucket if it doesn't exist
    - Set proper bucket configuration
    - Add storage policies for authenticated users
    - Enable public access for downloads
*/

-- First, ensure we can create the bucket
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'client-documents'
  ) THEN
    -- Create the bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'client-documents',
      'client-documents',
      true,
      52428800, -- 50MB limit
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
    );
  ELSE
    -- Update existing bucket settings
    UPDATE storage.buckets
    SET 
      public = true,
      file_size_limit = 52428800,
      allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
    WHERE id = 'client-documents';
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Create storage policies
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'client-documents' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid()
);

CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid()
);

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'client-documents');