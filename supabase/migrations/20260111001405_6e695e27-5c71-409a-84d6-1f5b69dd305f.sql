-- Drop the invalid check constraint that doesn't match our status values
ALTER TABLE public.litters DROP CONSTRAINT IF EXISTS litters_status_check;