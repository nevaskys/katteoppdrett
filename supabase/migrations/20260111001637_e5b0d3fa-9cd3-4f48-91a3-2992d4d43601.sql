-- Drop existing permissive policies and create authenticated-only policies

-- CATS table
DROP POLICY IF EXISTS "Allow all access to cats" ON public.cats;
CREATE POLICY "Authenticated users can view cats" ON public.cats FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert cats" ON public.cats FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update cats" ON public.cats FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete cats" ON public.cats FOR DELETE USING (auth.uid() IS NOT NULL);

-- IDEAS table
DROP POLICY IF EXISTS "Allow all access to ideas" ON public.ideas;
CREATE POLICY "Authenticated users can view ideas" ON public.ideas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update ideas" ON public.ideas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete ideas" ON public.ideas FOR DELETE USING (auth.uid() IS NOT NULL);

-- JUDGES table
DROP POLICY IF EXISTS "Allow all access to judges" ON public.judges;
CREATE POLICY "Authenticated users can view judges" ON public.judges FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert judges" ON public.judges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update judges" ON public.judges FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete judges" ON public.judges FOR DELETE USING (auth.uid() IS NOT NULL);

-- JUDGING_RESULTS table
DROP POLICY IF EXISTS "Allow all access to judging_results" ON public.judging_results;
CREATE POLICY "Authenticated users can view judging_results" ON public.judging_results FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert judging_results" ON public.judging_results FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update judging_results" ON public.judging_results FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete judging_results" ON public.judging_results FOR DELETE USING (auth.uid() IS NOT NULL);

-- KITTENS table
DROP POLICY IF EXISTS "Allow all access to kittens" ON public.kittens;
CREATE POLICY "Authenticated users can view kittens" ON public.kittens FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert kittens" ON public.kittens FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update kittens" ON public.kittens FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete kittens" ON public.kittens FOR DELETE USING (auth.uid() IS NOT NULL);

-- LITTERS table
DROP POLICY IF EXISTS "Allow all access to litters" ON public.litters;
CREATE POLICY "Authenticated users can view litters" ON public.litters FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert litters" ON public.litters FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update litters" ON public.litters FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete litters" ON public.litters FOR DELETE USING (auth.uid() IS NOT NULL);

-- SHOWS table
DROP POLICY IF EXISTS "Allow all access to shows" ON public.shows;
CREATE POLICY "Authenticated users can view shows" ON public.shows FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert shows" ON public.shows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update shows" ON public.shows FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete shows" ON public.shows FOR DELETE USING (auth.uid() IS NOT NULL);

-- TASKS table
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
CREATE POLICY "Authenticated users can view tasks" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE USING (auth.uid() IS NOT NULL);