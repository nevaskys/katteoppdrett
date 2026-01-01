import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus } from '@/types';

interface DbTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  related_cat_id: string | null;
  related_litter_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusMap: Record<string, TaskStatus> = {
  pending: 'pending',
  in_progress: 'pending',
  completed: 'completed',
};

const reverseStatusMap: Record<TaskStatus, string> = {
  pending: 'pending',
  completed: 'completed',
};

function dbToTask(db: DbTask): Task {
  return {
    id: db.id,
    title: db.title,
    dueDate: db.due_date || '',
    status: statusMap[db.status] || 'pending',
    catId: db.related_cat_id || undefined,
    litterId: db.related_litter_id || undefined,
    notes: db.description || undefined,
    createdAt: db.created_at,
  };
}

function taskToDb(task: Partial<Task> & { title: string }) {
  return {
    title: task.title,
    description: task.notes || null,
    due_date: task.dueDate || null,
    status: task.status ? reverseStatusMap[task.status] : 'pending',
    related_cat_id: task.catId || null,
    related_litter_id: task.litterId || null,
  };
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return (data as DbTask[]).map(dbToTask);
    },
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToDb(task as Task))
        .select()
        .single();
      
      if (error) throw error;
      return dbToTask(data as DbTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: Task) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(taskToDb(task))
        .eq('id', task.id)
        .select()
        .single();
      
      if (error) throw error;
      return dbToTask(data as DbTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
