import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WeightEntry } from './useKittens';
import { Json } from '@/integrations/supabase/types';

interface WeightUpdate {
  kittenId: string;
  weightLog: WeightEntry[];
}

export function useUpdateKittenWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: WeightUpdate[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('kittens')
          .update({ weight_log: update.weightLog as unknown as Json })
          .eq('id', update.kittenId);

        if (error) throw error;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kittens'] });
    },
  });
}
