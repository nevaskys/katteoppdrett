import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CostEntry {
  id: string;
  date: string | null;
  dateLabel: string | null;
  title: string;
  description: string | null;
  amount: number;
  direction: 'expense' | 'income';
  category: string;
  account: string | null;
  litterId: string | null;
  receiptImages: string[];
}

interface DbCostEntry {
  id: string;
  entry_date: string | null;
  date_label: string | null;
  title: string;
  description: string | null;
  amount: number;
  direction: string;
  category: string;
  account: string | null;
  litter_id: string | null;
  receipt_images: string[] | null;
}

function dbToEntry(db: DbCostEntry): CostEntry {
  return {
    id: db.id,
    date: db.entry_date,
    dateLabel: db.date_label,
    title: db.title,
    description: db.description,
    amount: db.amount,
    direction: db.direction === 'income' ? 'income' : 'expense',
    category: db.category,
    account: db.account,
    litterId: db.litter_id,
    receiptImages: db.receipt_images || [],
  };
}

export function useCostEntries() {
  return useQuery({
    queryKey: ['cost-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_entries')
        .select('*')
        .order('entry_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data as DbCostEntry[]).map(dbToEntry);
    },
  });
}

export function useAddCostEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      amount: number;
      direction: 'expense' | 'income';
      category: string;
      date: string | null;
      description?: string | null;
      litterId?: string | null;
      receiptImages?: string[];
    }) => {
      if (!user) throw new Error('Ikke logget inn');
      const { error } = await supabase.from('cost_entries').insert({
        user_id: user.id,
        title: input.title,
        amount: input.amount,
        direction: input.direction,
        category: input.category,
        entry_date: input.date,
        description: input.description || null,
        litter_id: input.litterId || null,
        receipt_images: input.receiptImages || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-entries'] });
      toast.success('Lagt til i økonomien');
    },
    onError: () => toast.error('Kunne ikke lagre'),
  });
}

export function useDeleteCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cost_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-entries'] });
      toast.success('Slettet');
    },
    onError: () => toast.error('Kunne ikke slette'),
  });
}

export function useUpdateCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; category?: string; litterId?: string | null }) => {
      const patch: { category?: string; litter_id?: string | null } = {};
      if (input.category !== undefined) patch.category = input.category;
      if (input.litterId !== undefined) patch.litter_id = input.litterId;
      const { error } = await supabase.from('cost_entries').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-entries'] });
      toast.success('Oppdatert');
    },
    onError: () => toast.error('Kunne ikke oppdatere'),
  });
}

export const COST_CATEGORIES = [
  'veterinær',
  'fôr og sand',
  'utstyr',
  'reise og utstilling',
  'stamtavler og medlemskap',
  'forsikring',
  'kjøp av katt',
  'fôrvert og avtaler',
  'marked og web',
  'inntekt',
  'annet',
];

export function formatKr(n: number) {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n) + ' kr';
}
