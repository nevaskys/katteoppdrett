-- Add pregnancy notes log field
ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS pregnancy_notes_log jsonb DEFAULT '[]'::jsonb;

-- Add mating notes field
ALTER TABLE public.litters ADD COLUMN IF NOT EXISTS mating_notes text;