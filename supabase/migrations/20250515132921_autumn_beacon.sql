/*
  # Add storage policies for diagnostic files

  1. Security
    - Add policies for anonymous users to upload and download files
    - Enable public access to diagnostic-files bucket
*/

-- Allow anonymous users to upload files to diagnostic-files bucket
CREATE POLICY "Allow anonymous uploads to diagnostic-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'diagnostic-files'
);

-- Allow anonymous users to download files from diagnostic-files bucket
CREATE POLICY "Allow anonymous downloads from diagnostic-files"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'diagnostic-files'
);

-- Allow anonymous users to update files in diagnostic-files bucket
CREATE POLICY "Allow anonymous updates to diagnostic-files"
ON storage.objects FOR UPDATE
TO anon
USING (
  bucket_id = 'diagnostic-files'
)
WITH CHECK (
  bucket_id = 'diagnostic-files'
);