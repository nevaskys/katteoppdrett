import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WaitlistEntry, WaitlistStatus } from '@/types';

interface DbWaitlistEntry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  preferred_gender: string | null;
  preferred_color: string | null;
  notes: string | null;
  status: string;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

const statusMap: Record<string, WaitlistStatus> = {
  waiting: 'waitlist',
  contacted: 'contacted',
  matched: 'deposit',
  completed: 'sold',
  cancelled: 'declined',
};

const reverseStatusMap: Record<WaitlistStatus, string> = {
  new: 'waiting',
  waitlist: 'waiting',
  contacted: 'contacted',
  deposit: 'matched',
  sold: 'completed',
  declined: 'cancelled',
};

function dbToWaitlistEntry(db: DbWaitlistEntry): WaitlistEntry {
  return {
    id: db.id,
    name: db.name,
    email: db.email || '',
    phone: db.phone || undefined,
    status: statusMap[db.status] || 'new',
    notes: db.notes || undefined,
    createdAt: db.created_at,
  };
}

function waitlistEntryToDb(entry: Partial<WaitlistEntry> & { name: string; email: string }) {
  return {
    name: entry.name,
    email: entry.email || null,
    phone: entry.phone || null,
    notes: entry.notes || null,
    status: entry.status ? reverseStatusMap[entry.status] : 'waiting',
  };
}

export function useWaitlist() {
  return useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data as DbWaitlistEntry[]).map(dbToWaitlistEntry);
    },
  });
}

export function useAddWaitlistEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: Omit<WaitlistEntry, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('waitlist')
        .insert(waitlistEntryToDb(entry as WaitlistEntry))
        .select()
        .single();
      
      if (error) throw error;
      return dbToWaitlistEntry(data as DbWaitlistEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}

export function useUpdateWaitlistEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: WaitlistEntry) => {
      const { data, error } = await supabase
        .from('waitlist')
        .update(waitlistEntryToDb(entry))
        .eq('id', entry.id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToWaitlistEntry(data as DbWaitlistEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}

export function useDeleteWaitlistEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}
