/*
  # Create storage bucket for client documents

  1. Changes
    - Create a new storage bucket for client documents
    - Set public access policy
*/

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their files
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

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid()
);

-- Allow public read access to files
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'client-documents');