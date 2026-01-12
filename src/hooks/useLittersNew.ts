import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Litter, LitterStatus, MotherWeightEntry, PregnancyNoteEntry } from '@/types/litter';
import { Json } from '@/integrations/supabase/types';

interface DbLitter {
  id: string;
  name: string;
  status: string;
  mother_id: string | null;
  father_id: string | null;
  external_father_name: string | null;
  external_father_pedigree_url: string | null;
  mating_date: string | null;
  mating_date_from: string | null;
  mating_date_to: string | null;
  expected_date: string | null;
  birth_date: string | null;
  completion_date: string | null;
  reasoning: string | null;
  inbreeding_coefficient: number | null;
  blood_type_notes: string | null;
  alternative_combinations: string | null;
  mating_notes: string | null;
  pregnancy_notes: string | null;
  pregnancy_notes_log: Json;
  mother_weight_log: Json;
  kitten_count: number | null;
  birth_notes: string | null;
  nrr_registered: boolean | null;
  evaluation: string | null;
  buyers_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function dbToLitter(db: DbLitter): Litter {
  const motherWeightLog = Array.isArray(db.mother_weight_log) 
    ? (db.mother_weight_log as unknown as MotherWeightEntry[])
    : [];
  
  const pregnancyNotesLog = Array.isArray(db.pregnancy_notes_log) 
    ? (db.pregnancy_notes_log as unknown as PregnancyNoteEntry[])
    : [];
  
  return {
    id: db.id,
    name: db.name,
    status: (db.status as LitterStatus) || 'planned',
    motherId: db.mother_id,
    fatherId: db.father_id,
    externalFatherName: db.external_father_name,
    externalFatherPedigreeUrl: db.external_father_pedigree_url,
    matingDate: db.mating_date,
    matingDateFrom: db.mating_date_from,
    matingDateTo: db.mating_date_to,
    expectedDate: db.expected_date,
    birthDate: db.birth_date,
    completionDate: db.completion_date,
    reasoning: db.reasoning,
    inbreedingCoefficient: db.inbreeding_coefficient,
    bloodTypeNotes: db.blood_type_notes,
    alternativeCombinations: db.alternative_combinations,
    matingNotes: db.mating_notes,
    pregnancyNotes: db.pregnancy_notes,
    pregnancyNotesLog,
    motherWeightLog,
    kittenCount: db.kitten_count,
    birthNotes: db.birth_notes,
    nrrRegistered: db.nrr_registered ?? false,
    evaluation: db.evaluation,
    buyersInfo: db.buyers_info,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function litterToDb(litter: Partial<Litter>) {
  return {
    name: litter.name,
    status: litter.status || 'planned',
    mother_id: litter.motherId || null,
    father_id: litter.fatherId || null,
    external_father_name: litter.externalFatherName || null,
    external_father_pedigree_url: litter.externalFatherPedigreeUrl || null,
    mating_date: litter.matingDate || null,
    mating_date_from: litter.matingDateFrom || null,
    mating_date_to: litter.matingDateTo || null,
    expected_date: litter.expectedDate || null,
    birth_date: litter.birthDate || null,
    completion_date: litter.completionDate || null,
    reasoning: litter.reasoning || null,
    inbreeding_coefficient: litter.inbreedingCoefficient || null,
    blood_type_notes: litter.bloodTypeNotes || null,
    alternative_combinations: litter.alternativeCombinations || null,
    mating_notes: litter.matingNotes || null,
    pregnancy_notes: litter.pregnancyNotes || null,
    pregnancy_notes_log: (litter.pregnancyNotesLog || []) as unknown as Json,
    mother_weight_log: (litter.motherWeightLog || []) as unknown as Json,
    kitten_count: litter.kittenCount || null,
    birth_notes: litter.birthNotes || null,
    nrr_registered: litter.nrrRegistered || false,
    evaluation: litter.evaluation || null,
    buyers_info: litter.buyersInfo || null,
    notes: litter.notes || null,
  };
}

export function useLittersGrouped() {
  return useQuery({
    queryKey: ['litters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('litters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const litters = (data as DbLitter[]).map(dbToLitter);
      
      return {
        planned: litters.filter(l => l.status === 'planned'),
        pending: litters.filter(l => l.status === 'pending'),
        active: litters.filter(l => l.status === 'active'),
        completed: litters.filter(l => l.status === 'completed'),
        all: litters,
      };
    },
  });
}

export function useLitterById(id: string | undefined) {
  return useQuery({
    queryKey: ['litters', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('litters')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return dbToLitter(data as DbLitter);
    },
    enabled: !!id,
  });
}

export function useCreateLitter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (litter: Partial<Litter> & { name: string }) => {
      const { data, error } = await supabase
        .from('litters')
        .insert(litterToDb(litter))
        .select()
        .single();
      
      if (error) throw error;
      return dbToLitter(data as DbLitter);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
    },
  });
}

export function useUpdateLitterNew() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (litter: Partial<Litter> & { id: string }) => {
      const { id, ...rest } = litter;
      const { data, error } = await supabase
        .from('litters')
        .update(litterToDb(rest))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToLitter(data as DbLitter);
    },
    onSuccess: (_, litter) => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['litters', litter.id] });
    },
  });
}

export function useUpdateLitterStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LitterStatus }) => {
      const { data, error } = await supabase
        .from('litters')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToLitter(data as DbLitter);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['litters'] });
      queryClient.invalidateQueries({ queryKey: ['litters', id] });
    },
  });
}

export function useDeleteLitterNew() {
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
