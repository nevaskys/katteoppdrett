-- Add images column to litters table for receipts and other documents
ALTER TABLE public.litters 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];