ALTER TABLE public.cats ADD COLUMN loan_status text NOT NULL DEFAULT 'own';
ALTER TABLE public.cats ADD COLUMN loan_party text;