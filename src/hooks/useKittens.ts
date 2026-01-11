import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbKitten {
  id: string;
  litter_id: string;
  name: string | null;
  gender: string | null;
  color: string | null;
  ems_code: string | null;
  status: string | null;
  reserved_by: string | null;
  notes: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface KittenInput {
  id?: string;
  litterId: string;
  name: string;
  gender: 'male' | 'female' | null;
  color: string;
  emsCode: string;
  status: 'available' | 'reserved' | 'sold' | 'keeping';
  reservedBy: string;
  notes: string;
}

function kittenToDb(kitten: KittenInput) {
  return {
    litter_id: kitten.litterId,
    name: kitten.name || null,
    gender: kitten.gender || null,
    color: kitten.color || null,
    ems_code: kitten.emsCode || null,
    status: kitten.status || 'available',
    reserved_by: kitten.reservedBy || null,
    notes: kitten.notes || null,
  };
}

export function useKittensByLitter(litterId: string | undefined) {
  return useQuery({
    queryKey: ['kittens', litterId],
    queryFn: async () => {
      if (!litterId) return [];
      
      const { data, error } = await supabase
        .from('kittens')
        .select('*')
        .eq('litter_id', litterId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as DbKitten[];
    },
    enabled: !!litterId,
  });
}

export function useSaveKittens() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ litterId, kittens }: { litterId: string; kittens: KittenInput[] }) => {
      // Get existing kittens for this litter
      const { data: existingKittens, error: fetchError } = await supabase
        .from('kittens')
        .select('id')
        .eq('litter_id', litterId);
      
      if (fetchError) throw fetchError;
      
      const existingIds = new Set((existingKittens || []).map(k => k.id));
      const newKittenIds = new Set(kittens.filter(k => k.id).map(k => k.id));
      
      // Delete kittens that are no longer in the list
      const toDelete = [...existingIds].filter(id => !newKittenIds.has(id));
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('kittens')
          .delete()
          .in('id', toDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // Upsert all kittens
      for (const kitten of kittens) {
        const kittenData = kittenToDb({ ...kitten, litterId });
        
        if (kitten.id && existingIds.has(kitten.id)) {
          // Update existing
          const { error } = await supabase
            .from('kittens')
            .update(kittenData)
            .eq('id', kitten.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('kittens')
            .insert(kittenData);
          
          if (error) throw error;
        }
      }
      
      return true;
    },
    onSuccess: (_, { litterId }) => {
      queryClient.invalidateQueries({ queryKey: ['kittens', litterId] });
      queryClient.invalidateQueries({ queryKey: ['litters'] });
    },
  });
}
