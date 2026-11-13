CREATE TABLE public.import_staging (id serial primary key, stmt text not null);
GRANT ALL ON public.import_staging TO service_role;
GRANT INSERT, SELECT ON public.import_staging TO postgres;
ALTER TABLE public.import_staging ENABLE ROW LEVEL SECURITY;