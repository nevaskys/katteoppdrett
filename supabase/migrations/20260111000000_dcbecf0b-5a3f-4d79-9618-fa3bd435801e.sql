-- Add mating date range fields
ALTER TABLE public.litters 
ADD COLUMN IF NOT EXISTS mating_date_from date,
ADD COLUMN IF NOT EXISTS mating_date_to date;

-- Migrate existing mating_date to mating_date_from if it exists
UPDATE public.litters 
SET mating_date_from = mating_date 
WHERE mating_date IS NOT NULL AND mating_date_from IS NULL;