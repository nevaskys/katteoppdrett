-- Add result field to judging_results table
ALTER TABLE public.judging_results 
ADD COLUMN result text;