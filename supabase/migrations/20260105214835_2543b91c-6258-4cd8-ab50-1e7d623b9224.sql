-- Remove microchip column from cats table
ALTER TABLE public.cats DROP COLUMN IF EXISTS microchip;