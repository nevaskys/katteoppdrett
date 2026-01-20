import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function useSuggestions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Suggestion[];
    },
    enabled: !!user?.id,
  });
}

export function useAddSuggestion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (suggestion: { title: string; description?: string; category?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title: suggestion.title,
          description: suggestion.description || null,
          category: suggestion.category || 'general',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('Forslag sendt!');
    },
    onError: (error: Error) => {
      toast.error('Kunne ikke sende forslag: ' + error.message);
    },
  });
}

export function useUpdateSuggestionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('Status oppdatert');
    },
    onError: (error: Error) => {
      toast.error('Kunne ikke oppdatere: ' + error.message);
    },
  });
}

export function useDeleteSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.success('Forslag slettet');
    },
    onError: (error: Error) => {
      toast.error('Kunne ikke slette: ' + error.message);
    },
  });
}
