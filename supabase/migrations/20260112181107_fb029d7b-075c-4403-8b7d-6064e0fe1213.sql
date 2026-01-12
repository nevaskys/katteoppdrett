-- Add birth notes to litters table
ALTER TABLE public.litters 
ADD COLUMN IF NOT EXISTS birth_notes text;

-- Add birth weight to kittens table (weight in grams)
ALTER TABLE public.kittens 
ADD COLUMN IF NOT EXISTS birth_weight integer;