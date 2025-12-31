import { useState } from 'react';
import { Plus, CheckSquare, Trash2, Edit2, Check } from 'lucide-react';
import { useData } from '@/context/DataContext';
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
  const { tasks, cats, litters, addTask, updateTask, deleteTask } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
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
      toast.error('Title and due date are required');
      return;
    }

    const taskData: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      title: formData.title,
      dueDate: formData.dueDate,
      status: formData.status,
      catId: formData.catId || undefined,
      litterId: formData.litterId || undefined,
      notes: formData.notes || undefined,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
    };

    if (editingTask) {
      updateTask(taskData);
      toast.success('Task updated');
    } else {
      addTask(taskData);
      toast.success('Task added');
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const toggleTaskStatus = (task: Task) => {
    updateTask({ ...task, status: task.status === 'pending' ? 'completed' : 'pending' });
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
    return mother ? `${mother.name}'s litter` : 'Unknown litter';
  };

  const isOverdue = (date: string) => new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Link to Cat</Label>
                  <Select
                    value={formData.catId}
                    onValueChange={value => setFormData(prev => ({ ...prev, catId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {cats.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link to Litter</Label>
                  <Select
                    value={formData.litterId}
                    onValueChange={value => setFormData(prev => ({ ...prev, litterId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {litters.map(litter => {
                        const mother = cats.find(c => c.id === litter.motherId);
                        return (
                          <SelectItem key={litter.id} value={litter.id}>
                            {mother?.name || 'Unknown'} - {new Date(litter.birthDate).toLocaleDateString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingTask ? 'Save Changes' : 'Add Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">No tasks yet</p>
          <p className="text-sm mb-4">Create tasks to stay organized</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4">Pending ({pendingTasks.length})</h2>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">All tasks completed!</p>
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
                          {isToday(task.dueDate) ? 'Today' : new Date(task.dueDate).toLocaleDateString()}
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
                            <AlertDialogTitle>Delete task?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTask(task.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Completed ({completedTasks.length})</h2>
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
                          <AlertDialogTitle>Delete task?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTask(task.id)}>Delete</AlertDialogAction>
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
