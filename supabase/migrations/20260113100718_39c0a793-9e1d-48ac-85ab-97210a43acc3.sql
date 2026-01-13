-- Create storage bucket for litter receipts and documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('litter-receipts', 'litter-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to litter-receipts bucket
CREATE POLICY "Authenticated users can upload litter receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'litter-receipts' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to view litter receipts
CREATE POLICY "Authenticated users can view litter receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'litter-receipts' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their litter receipts
CREATE POLICY "Authenticated users can delete litter receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'litter-receipts' AND
  auth.uid() IS NOT NULL
);