import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Cat } from '@/types';

interface DbCat {
  id: string;
  name: string;
  breed: string;
  gender: 'male' | 'female';
  date_of_birth: string | null;
  color: string | null;
  ems_code: string | null;
  registration_number: string | null;
  owner: string | null;
  breeder: string | null;
  images: string[] | null;
  pedigree_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function dbToCat(db: DbCat): Cat {
  return {
    id: db.id,
    name: db.name,
    breed: db.breed,
    gender: db.gender,
    birthDate: db.date_of_birth || '',
    registration: db.registration_number || undefined,
    color: db.color || '',
    emsCode: db.ems_code || undefined,
    images: db.images || [],
    pedigreeImage: db.pedigree_url || undefined,
    createdAt: db.created_at,
  };
}

function catToDb(cat: Partial<Cat> & { name: string; breed: string; gender: 'male' | 'female' }) {
  return {
    name: cat.name,
    breed: cat.breed,
    gender: cat.gender,
    date_of_birth: cat.birthDate || null,
    color: cat.color || null,
    ems_code: cat.emsCode || null,
    registration_number: cat.registration || null,
    images: cat.images || [],
    pedigree_url: cat.pedigreeImage || null,
  };
}

export function useCats() {
  return useQuery({
    queryKey: ['cats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as DbCat[]).map(dbToCat);
    },
  });
}

export function useCat(id: string | undefined) {
  return useQuery({
    queryKey: ['cats', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data ? dbToCat(data as DbCat) : null;
    },
    enabled: !!id,
  });
}

export function useAddCat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cat: Omit<Cat, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('cats')
        .insert(catToDb(cat as Cat))
        .select()
        .single();
      
      if (error) throw error;
      return dbToCat(data as DbCat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats'] });
    },
  });
}

export function useUpdateCat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cat: Cat) => {
      const { data, error } = await supabase
        .from('cats')
        .update(catToDb(cat))
        .eq('id', cat.id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToCat(data as DbCat);
    },
    onSuccess: (_, cat) => {
      queryClient.invalidateQueries({ queryKey: ['cats'] });
      queryClient.invalidateQueries({ queryKey: ['cats', cat.id] });
    },
  });
}

export function useDeleteCat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cats')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats'] });
    },
  });
}
