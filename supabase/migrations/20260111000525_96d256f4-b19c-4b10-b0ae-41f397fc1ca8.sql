-- Drop waitlist table and its policies
DROP POLICY IF EXISTS "Allow all access to waitlist" ON public.waitlist;
DROP TABLE IF EXISTS public.waitlist;