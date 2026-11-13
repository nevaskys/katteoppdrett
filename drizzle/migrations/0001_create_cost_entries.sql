CREATE TABLE public.cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date,
  date_label text,
  title text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL,
  direction text NOT NULL DEFAULT 'expense',
  category text NOT NULL DEFAULT 'annet',
  account text,
  litter_id uuid REFERENCES public.litters(id) ON DELETE SET NULL,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_entries TO authenticated;
GRANT ALL ON public.cost_entries TO service_role;

ALTER TABLE public.cost_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cost entries" ON public.cost_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cost entries" ON public.cost_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cost entries" ON public.cost_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cost entries" ON public.cost_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_cost_entries_updated_at BEFORE UPDATE ON public.cost_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();