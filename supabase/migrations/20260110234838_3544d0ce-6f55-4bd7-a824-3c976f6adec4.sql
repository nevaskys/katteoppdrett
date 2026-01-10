-- Add new fields to litters table for the complete workflow
ALTER TABLE public.litters 
ADD COLUMN IF NOT EXISTS mating_date date,
ADD COLUMN IF NOT EXISTS reasoning text,
ADD COLUMN IF NOT EXISTS inbreeding_coefficient decimal(5,2),
ADD COLUMN IF NOT EXISTS blood_type_notes text,
ADD COLUMN IF NOT EXISTS alternative_combinations text,
ADD COLUMN IF NOT EXISTS pregnancy_notes text,
ADD COLUMN IF NOT EXISTS mother_weight_log jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS completion_date date,
ADD COLUMN IF NOT EXISTS nrr_registered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS evaluation text,
ADD COLUMN IF NOT EXISTS buyers_info text;

-- Update status field with new values and default
-- First update any existing statuses to match new format
UPDATE public.litters SET status = 'planned' WHERE status = 'planned';
UPDATE public.litters SET status = 'active' WHERE status = 'born';

-- Add comment to explain status values
COMMENT ON COLUMN public.litters.status IS 'Status: planned (planlagt), pending (ventende), active (aktivt), completed (avsluttet)';