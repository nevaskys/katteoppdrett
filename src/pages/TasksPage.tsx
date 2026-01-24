import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckSquare, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useTasks, useAddTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useCats } from '@/hooks/useCats';
import { useLitters } from '@/hooks/useLitters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Task, TaskStatus } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { t } = useTranslation();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: litters = [], isLoading: littersLoading } = useLitters();
  const addTaskMutation = useAddTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const isLoading = tasksLoading || catsLoading || littersLoading;
  
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    status: 'pending' as TaskStatus,
    catId: '',
    litterId: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ title: '', dueDate: '', status: 'pending', catId: '', litterId: '', notes: '' });
    setEditingTask(null);
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        catId: task.catId || '',
        litterId: task.litterId || '',
        notes: task.notes || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.dueDate) {
      toast.error(t('tasks.title') + ' & ' + t('tasks.dueDate') + ' required');
      return;
    }

    const taskData = {
      title: formData.title,
      dueDate: formData.dueDate,
      status: formData.status,
      catId: formData.catId || undefined,
      litterId: formData.litterId || undefined,
      notes: formData.notes || undefined,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ ...taskData, id: editingTask.id, createdAt: editingTask.createdAt }, {
        onSuccess: () => {
          toast.success(t('common.update') + ' ' + t('common.success').toLowerCase());
          setDialogOpen(false);
          resetForm();
        },
      });
    } else {
      addTaskMutation.mutate(taskData as Omit<Task, 'id' | 'createdAt'>, {
        onSuccess: () => {
          toast.success(t('common.add') + ' ' + t('common.success').toLowerCase());
          setDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const toggleTaskStatus = (task: Task) => {
    updateTaskMutation.mutate({ ...task, status: task.status === 'pending' ? 'completed' : 'pending' });
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending').sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const getCatName = (id?: string) => id ? cats.find(c => c.id === id)?.name : null;
  const getLitterInfo = (id?: string) => {
    if (!id) return null;
    const litter = litters.find(l => l.id === id);
    if (!litter) return null;
    const mother = cats.find(c => c.id === litter.motherId);
    return mother ? `${mother.name}s kull` : 'Ukjent kull';
  };

  const isOverdue = (date: string) => new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('tasks.title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" /> {t('tasks.addTask')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? t('common.edit') : t('common.add')} {t('tasks.title').toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('tasks.title')} *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tasks.dueDate')} *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('cats.title')}</Label>
                  <Select
                    value={formData.catId}
                    onValueChange={value => setFormData(prev => ({ ...prev, catId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.none')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('common.none')}</SelectItem>
                      {cats.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('litters.title')}</Label>
                  <Select
                    value={formData.litterId}
                    onValueChange={value => setFormData(prev => ({ ...prev, litterId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.none')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('common.none')}</SelectItem>
                      {litters.map(litter => {
                        const mother = cats.find(c => c.id === litter.motherId);
                        return (
                          <SelectItem key={litter.id} value={litter.id}>
                            {mother?.name || t('common.none')} - {new Date(litter.birthDate).toLocaleDateString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('cats.notes')}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingTask ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">{t('tasks.noTasks')}</p>
          <p className="text-sm mb-4">{t('tasks.noTasksDescription')}</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" /> {t('tasks.addTask')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ventende oppgaver */}
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4">{t('litters.status.pending')} ({pendingTasks.length})</h2>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('tasks.status.done')}!</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => toggleTaskStatus(task)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={cn(
                          "text-xs",
                          isOverdue(task.dueDate) && "text-destructive font-medium",
                          isToday(task.dueDate) && "text-primary font-medium",
                          !isOverdue(task.dueDate) && !isToday(task.dueDate) && "text-muted-foreground"
                        )}>
                          {isToday(task.dueDate) ? 'I dag' : new Date(task.dueDate).toLocaleDateString('nb-NO')}
                        </span>
                        {getCatName(task.catId) && (
                          <Badge variant="outline" className="text-xs">{getCatName(task.catId)}</Badge>
                        )}
                        {getLitterInfo(task.litterId) && (
                          <Badge variant="outline" className="text-xs">{getLitterInfo(task.litterId)}</Badge>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(task)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.delete')}?</AlertDialogTitle>
                            <AlertDialogDescription>{t('common.confirm')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTaskMutation.mutate(task.id)}>{t('common.delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fullførte oppgaver */}
          {completedTasks.length > 0 && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">{t('tasks.status.done')} ({completedTasks.length})</h2>
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => toggleTaskStatus(task)}
                    />
                    <p className="flex-1 line-through text-muted-foreground">{task.title}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('common.delete')}?</AlertDialogTitle>
                          <AlertDialogDescription>{t('common.confirm')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTaskMutation.mutate(task.id)}>{t('common.delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}