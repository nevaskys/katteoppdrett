-- Add complication field to kittens table for tracking stillbirths and complications
ALTER TABLE public.kittens 
ADD COLUMN complication_type text DEFAULT NULL;

-- Complication types: 'stillborn', 'deceased', 'complications', null (healthy)