
-- Create cats table
CREATE TABLE public.cats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  color TEXT,
  ems_code TEXT,
  microchip TEXT,
  registration_number TEXT,
  owner TEXT,
  breeder TEXT,
  images TEXT[] DEFAULT '{}',
  pedigree_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create litters table
CREATE TABLE public.litters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mother_id UUID REFERENCES public.cats(id) ON DELETE SET NULL,
  father_id UUID REFERENCES public.cats(id) ON DELETE SET NULL,
  external_father_name TEXT,
  external_father_pedigree_url TEXT,
  birth_date DATE,
  expected_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'expected', 'born', 'available', 'sold')),
  kitten_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kittens table
CREATE TABLE public.kittens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  litter_id UUID NOT NULL REFERENCES public.litters(id) ON DELETE CASCADE,
  name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  color TEXT,
  ems_code TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'keeping')),
  reserved_by TEXT,
  images TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_gender TEXT CHECK (preferred_gender IN ('male', 'female', 'any')),
  preferred_color TEXT,
  notes TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'matched', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  related_cat_id UUID REFERENCES public.cats(id) ON DELETE SET NULL,
  related_litter_id UUID REFERENCES public.litters(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_cats_updated_at BEFORE UPDATE ON public.cats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_litters_updated_at BEFORE UPDATE ON public.litters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kittens_updated_at BEFORE UPDATE ON public.kittens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables (but allow public access for now since this is a personal cattery management app)
ALTER TABLE public.cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kittens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (personal app without multi-user auth for now)
CREATE POLICY "Allow all access to cats" ON public.cats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to litters" ON public.litters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to kittens" ON public.kittens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to waitlist" ON public.waitlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
