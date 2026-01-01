import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Litter, Kitten } from '@/types';

interface DbLitter {
  id: string;
  name: string;
  mother_id: string | null;
  father_id: string | null;
  external_father_name: string | null;
  external_father_pedigree_url: string | null;
  birth_date: string | null;
  expected_date: string | null;
  status: string;
  kitten_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbKitten {
  id: string;
  litter_id: string;
  name: string | null;
  gender: 'male' | 'female' | null;
  color: string | null;
  ems_code: string | null;
  status: string | null;
  reserved_by: string | null;
  images: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function dbToLitter(db: DbLitter, kittens: Kitten[] = []): Litter {
  return {
    id: db.id,
    motherId: db.mother_id || '',
    fatherId: db.father_id || '',
    birthDate: db.birth_date || '',
    count: db.kitten_count || 0,
    notes: db.notes || undefined,
    kittens,
    createdAt: db.created_at,
  };
}

function dbToKitten(db: DbKitten): Kitten {
  return {
    id: db.id,
    name: db.name || '',
    gender: db.gender || 'male',
    color: db.color || '',
    markings: db.notes || undefined,
    weightLog: [],
  };
}

function litterToDb(litter: Partial<Litter> & { motherId: string; fatherId: string }) {
  return {
    name: `Kull ${new Date().toLocaleDateString('nb-NO')}`,
    mother_id: litter.motherId || null,
    father_id: litter.fatherId || null,
    birth_date: litter.birthDate || null,
    kitten_count: litter.count || 0,
    notes: litter.notes || null,
    status: 'born',
  };
}

export function useLitters() {
  return useQuery({
    queryKey: ['litters'],
    queryFn: async () => {
      const { data: littersData, error: littersError } = await supabase
        .from('litters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (littersError) throw littersError;

      const { data: kittensData, error: kittensError } = await supabase
        .from('kittens')
        .select('*');
      
      if (kittensError) throw kittensError;

      const kittensMap = new Map<string, Kitten[]>();
      (kittensData as DbKitten[]).forEach(k => {
        const kitten = dbToKitten(k);
        const existing = kittensMap.get(k.litter_id) || [];
        existing.push(kitten);
        kittensMap.set(k.litter_id, existing);
      });

      return (littersData as DbLitter[]).map(l => dbToLitter(l, kittensMap.get(l.id) || []));
    },
  });
}

export function useLitter(id: string | undefined) {
  return useQuery({
    queryKey: ['litters', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: litterData, error: litterError } = await supabase
        .from('litters')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (litterError) throw litterError;
      if (!litterData) return null;

      const { data: kittensData, error: kittensError } = await supabase
        .from('kittens')
        .select('*')
        .eq('litter_id', id);
      
      if (kittensError) throw kittensError;

      const kittens = (kittensData as DbKitten[]).map(dbToKitten);
      return dbToLitter(litterData as DbLitter, kittens);
    },
    enabled: !!id,
  });
}

export function useAddLitter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (litter: Omit<Litter, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('litters')
        .insert(litterToDb(litter))
        .select()
        .single();
      
      if (error) throw error;

      // Add kittens if any
      if (litter.kittens && litter.kittens.length > 0) {
        const kittensToInsert = litter.kittens.map(k => ({
          litter_id: data.id,
          name: k.name || null,
          gender: k.gender,
          color: k.color || null,
          notes: k.markings || null,
        }));

        const { error: kittensError } = await supabase
          .from('kittens')
          .insert(kittensToInsert);
        
        if (kittensError) throw kittensError;
      }

      return dbToLitter(data as DbLitter, litter.kittens || []);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
    },
  });
}

export function useUpdateLitter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (litter: Litter) => {
      const { data, error } = await supabase
        .from('litters')
        .update({
          mother_id: litter.motherId || null,
          father_id: litter.fatherId || null,
          birth_date: litter.birthDate || null,
          kitten_count: litter.count || 0,
          notes: litter.notes || null,
        })
        .eq('id', litter.id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToLitter(data as DbLitter, litter.kittens);
    },
    onSuccess: (_, litter) => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['litters', litter.id] });
    },
  });
}

export function useDeleteLitter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('litters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
    },
  });
}
