import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Judge {
  id: string;
  name: string;
  country?: string;
  organization?: string;
  notes?: string;
  createdAt: string;
}

export interface Show {
  id: string;
  name: string;
  location?: string;
  date?: string;
  organization?: string;
  notes?: string;
  createdAt: string;
}

export interface JudgingResult {
  id: string;
  catId: string;
  judgeId?: string;
  showId?: string;
  date: string;
  images: string[];
  ocrText?: string;
  structuredResult?: Record<string, unknown>;
  myRating?: number;
  notes?: string;
  createdAt: string;
  cat?: { id: string; name: string };
  judge?: { id: string; name: string };
  show?: { id: string; name: string };
}

interface DbJudge {
  id: string;
  name: string;
  country: string | null;
  organization: string | null;
  notes: string | null;
  created_at: string;
}

interface DbShow {
  id: string;
  name: string;
  location: string | null;
  date: string | null;
  organization: string | null;
  notes: string | null;
  created_at: string;
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface DbJudgingResult {
  id: string;
  cat_id: string;
  judge_id: string | null;
  show_id: string | null;
  date: string;
  images: string[] | null;
  ocr_text: string | null;
  structured_result: Record<string, unknown> | null;
  my_rating: number | null;
  notes: string | null;
  created_at: string;
  cats?: { id: string; name: string };
  judges?: { id: string; name: string } | null;
  shows?: { id: string; name: string } | null;
}

function dbToJudge(db: DbJudge): Judge {
  return {
    id: db.id,
    name: db.name,
    country: db.country || undefined,
    organization: db.organization || undefined,
    notes: db.notes || undefined,
    createdAt: db.created_at,
  };
}

function dbToShow(db: DbShow): Show {
  return {
    id: db.id,
    name: db.name,
    location: db.location || undefined,
    date: db.date || undefined,
    organization: db.organization || undefined,
    notes: db.notes || undefined,
    createdAt: db.created_at,
  };
}

function dbToJudgingResult(db: DbJudgingResult): JudgingResult {
  return {
    id: db.id,
    catId: db.cat_id,
    judgeId: db.judge_id || undefined,
    showId: db.show_id || undefined,
    date: db.date,
    images: db.images || [],
    ocrText: db.ocr_text || undefined,
    structuredResult: db.structured_result || undefined,
    myRating: db.my_rating ?? undefined,
    notes: db.notes || undefined,
    createdAt: db.created_at,
    cat: db.cats ? { id: db.cats.id, name: db.cats.name } : undefined,
    judge: db.judges ? { id: db.judges.id, name: db.judges.name } : undefined,
    show: db.shows ? { id: db.shows.id, name: db.shows.name } : undefined,
  };
}

// Judges hooks
export function useJudges() {
  return useQuery({
    queryKey: ['judges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('judges')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data as DbJudge[]).map(dbToJudge);
    },
  });
}

export function useAddJudge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (judge: { name: string; country?: string; organization?: string }) => {
      const { data, error } = await supabase
        .from('judges')
        .insert({ name: judge.name, country: judge.country || null, organization: judge.organization || null })
        .select()
        .single();
      if (error) throw error;
      return dbToJudge(data as DbJudge);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['judges'] }),
  });
}

// Shows hooks
export function useShows() {
  return useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as DbShow[]).map(dbToShow);
    },
  });
}

export function useAddShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (show: { name: string; location?: string; date?: string; organization?: string }) => {
      const { data, error } = await supabase
        .from('shows')
        .insert({ 
          name: show.name, 
          location: show.location || null, 
          date: show.date || null,
          organization: show.organization || null 
        })
        .select()
        .single();
      if (error) throw error;
      return dbToShow(data as DbShow);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shows'] }),
  });
}

// Judging Results hooks
export function useJudgingResults(catId?: string) {
  return useQuery({
    queryKey: ['judging-results', catId],
    queryFn: async () => {
      let query = supabase
        .from('judging_results')
        .select(`
          *,
          cats:cat_id(id, name),
          judges:judge_id(id, name),
          shows:show_id(id, name)
        `)
        .order('date', { ascending: false });
      
      if (catId) {
        query = query.eq('cat_id', catId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data as DbJudgingResult[]).map(dbToJudgingResult);
    },
  });
}

export function useJudgingResult(id: string | undefined) {
  return useQuery({
    queryKey: ['judging-results', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('judging_results')
        .select(`
          *,
          cats:cat_id(id, name),
          judges:judge_id(id, name),
          shows:show_id(id, name)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? dbToJudgingResult(data as DbJudgingResult) : null;
    },
    enabled: !!id,
  });
}

export function useAddJudgingResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (result: {
      catId: string;
      judgeId?: string;
      showId?: string;
      date: string;
      images?: string[];
      ocrText?: string;
      structuredResult?: Json;
      myRating?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('judging_results')
        .insert([{
          cat_id: result.catId,
          judge_id: result.judgeId || null,
          show_id: result.showId || null,
          date: result.date,
          images: result.images || [],
          ocr_text: result.ocrText || null,
          structured_result: result.structuredResult || null,
          my_rating: result.myRating ?? null,
          notes: result.notes || null,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judging-results'] });
    },
  });
}

export function useUpdateJudgingResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (result: {
      id: string;
      catId: string;
      judgeId?: string;
      showId?: string;
      date: string;
      images?: string[];
      ocrText?: string;
      structuredResult?: Json;
      myRating?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('judging_results')
        .update({
          cat_id: result.catId,
          judge_id: result.judgeId || null,
          show_id: result.showId || null,
          date: result.date,
          images: result.images || [],
          ocr_text: result.ocrText || null,
          structured_result: result.structuredResult as Json || null,
          my_rating: result.myRating ?? null,
          notes: result.notes || null,
        })
        .eq('id', result.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, result) => {
      queryClient.invalidateQueries({ queryKey: ['judging-results'] });
      queryClient.invalidateQueries({ queryKey: ['judging-results', 'detail', result.id] });
    },
  });
}

export function useDeleteJudgingResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('judging_results')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judging-results'] });
    },
  });
}
