
-- Add user_id column to cats table
ALTER TABLE public.cats ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to litters table
ALTER TABLE public.litters ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to kittens table
ALTER TABLE public.kittens ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to judging_results table
ALTER TABLE public.judging_results ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to judges table
ALTER TABLE public.judges ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to shows table
ALTER TABLE public.shows ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to belong to the first admin user (your account)
-- First, get any existing user and assign data to them
UPDATE public.cats SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.litters SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.kittens SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.tasks SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.judging_results SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.judges SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.shows SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE public.cats ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.litters ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.kittens ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.judging_results ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.judges ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.shows ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies for cats
DROP POLICY IF EXISTS "Authenticated users can view cats" ON public.cats;
DROP POLICY IF EXISTS "Authenticated users can insert cats" ON public.cats;
DROP POLICY IF EXISTS "Authenticated users can update cats" ON public.cats;
DROP POLICY IF EXISTS "Authenticated users can delete cats" ON public.cats;

-- Create new user-specific RLS policies for cats
CREATE POLICY "Users can view own cats" ON public.cats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cats" ON public.cats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cats" ON public.cats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cats" ON public.cats FOR DELETE USING (auth.uid() = user_id);

-- Drop existing RLS policies for litters
DROP POLICY IF EXISTS "Authenticated users can view litters" ON public.litters;
DROP POLICY IF EXISTS "Authenticated users can insert litters" ON public.litters;
DROP POLICY IF EXISTS "Authenticated users can update litters" ON public.litters;
DROP POLICY IF EXISTS "Authenticated users can delete litters" ON public.litters;

-- Create new user-specific RLS policies for litters
CREATE POLICY "Users can view own litters" ON public.litters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own litters" ON public.litters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own litters" ON public.litters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own litters" ON public.litters FOR DELETE USING (auth.uid() = user_id);

-- Drop existing RLS policies for kittens
DROP POLICY IF EXISTS "Authenticated users can view kittens" ON public.kittens;
DROP POLICY IF EXISTS "Authenticated users can insert kittens" ON public.kittens;
DROP POLICY IF EXISTS "Authenticated users can update kittens" ON public.kittens;
DROP POLICY IF EXISTS "Authenticated users can delete kittens" ON public.kittens;

-- Create new user-specific RLS policies for kittens
CREATE POLICY "Users can view own kittens" ON public.kittens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kittens" ON public.kittens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kittens" ON public.kittens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kittens" ON public.kittens FOR DELETE USING (auth.uid() = user_id);

-- Drop existing RLS policies for tasks
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;

-- Create new user-specific RLS policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Drop existing RLS policies for judging_results
DROP POLICY IF EXISTS "Authenticated users can view judging_results" ON public.judging_results;
DROP POLICY IF EXISTS "Authenticated users can insert judging_results" ON public.judging_results;
DROP POLICY IF EXISTS "Authenticated users can update judging_results" ON public.judging_results;
DROP POLICY IF EXISTS "Authenticated users can delete judging_results" ON public.judging_results;

-- Create new user-specific RLS policies for judging_results
CREATE POLICY "Users can view own judging_results" ON public.judging_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own judging_results" ON public.judging_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own judging_results" ON public.judging_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own judging_results" ON public.judging_results FOR DELETE USING (auth.uid() = user_id);

-- Drop existing RLS policies for judges
DROP POLICY IF EXISTS "Authenticated users can view judges" ON public.judges;
DROP POLICY IF EXISTS "Authenticated users can insert judges" ON public.judges;
DROP POLICY IF EXISTS "Authenticated users can update judges" ON public.judges;
DROP POLICY IF EXISTS "Authenticated users can delete judges" ON public.judges;

-- Create new user-specific RLS policies for judges
CREATE POLICY "Users can view own judges" ON public.judges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own judges" ON public.judges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own judges" ON public.judges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own judges" ON public.judges FOR DELETE USING (auth.uid() = user_id);

-- Drop existing RLS policies for shows
DROP POLICY IF EXISTS "Authenticated users can view shows" ON public.shows;
DROP POLICY IF EXISTS "Authenticated users can insert shows" ON public.shows;
DROP POLICY IF EXISTS "Authenticated users can update shows" ON public.shows;
DROP POLICY IF EXISTS "Authenticated users can delete shows" ON public.shows;

-- Create new user-specific RLS policies for shows
CREATE POLICY "Users can view own shows" ON public.shows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shows" ON public.shows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shows" ON public.shows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shows" ON public.shows FOR DELETE USING (auth.uid() = user_id);
