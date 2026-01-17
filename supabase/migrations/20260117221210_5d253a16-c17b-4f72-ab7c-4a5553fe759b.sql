-- Add weight_log column to kittens table for tracking daily weights
ALTER TABLE public.kittens 
ADD COLUMN weight_log jsonb DEFAULT '[]'::jsonb;