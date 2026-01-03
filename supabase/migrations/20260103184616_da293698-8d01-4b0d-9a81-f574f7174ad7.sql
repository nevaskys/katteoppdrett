-- Create judges table
CREATE TABLE public.judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  organization TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shows table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  date DATE,
  organization TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create judging_results table
CREATE TABLE public.judging_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cat_id UUID NOT NULL REFERENCES public.cats(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES public.judges(id) ON DELETE SET NULL,
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  images TEXT[] DEFAULT '{}'::text[],
  ocr_text TEXT,
  structured_result JSONB,
  my_rating INTEGER CHECK (my_rating >= 0 AND my_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judging_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for judges
CREATE POLICY "Allow all access to judges" ON public.judges FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for shows
CREATE POLICY "Allow all access to shows" ON public.shows FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for judging_results
CREATE POLICY "Allow all access to judging_results" ON public.judging_results FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_judges_updated_at
  BEFORE UPDATE ON public.judges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_judging_results_updated_at
  BEFORE UPDATE ON public.judging_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_judging_results_cat_id ON public.judging_results(cat_id);
CREATE INDEX idx_judging_results_judge_id ON public.judging_results(judge_id);
CREATE INDEX idx_judging_results_show_id ON public.judging_results(show_id);
CREATE INDEX idx_judging_results_date ON public.judging_results(date DESC);