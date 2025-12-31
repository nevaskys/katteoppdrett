import { useState } from 'react';
import { Plus, ClipboardList, Trash2, Edit2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { WaitlistEntry, WaitlistStatus } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusLabels: Record<WaitlistStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  waitlist: 'Waiting List',
  deposit: 'Deposit',
  sold: 'Sold',
  declined: 'Declined',
};

const statusColors: Record<WaitlistStatus, string> = {
  new: 'bg-status-new text-white',
  contacted: 'bg-status-contacted text-white',
  waitlist: 'bg-status-waitlist text-white',
  deposit: 'bg-status-deposit text-white',
  sold: 'bg-status-sold text-white',
  declined: 'bg-status-declined text-white',
};

export default function WaitlistPage() {
  const { waitlist, addWaitlistEntry, updateWaitlistEntry, deleteWaitlistEntry } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new' as WaitlistStatus,
    notes: '',
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', status: 'new', notes: '' });
    setEditingEntry(null);
  };

  const handleOpenDialog = (entry?: WaitlistEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        name: entry.name,
        email: entry.email,
        phone: entry.phone || '',
        status: entry.status,
        notes: entry.notes || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    const entryData: WaitlistEntry = {
      id: editingEntry?.id || crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
    };

    if (editingEntry) {
      updateWaitlistEntry(entryData);
      toast.success('Contact updated');
    } else {
      addWaitlistEntry(entryData);
      toast.success('Contact added');
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleStatusChange = (entry: WaitlistEntry, status: WaitlistStatus) => {
    updateWaitlistEntry({ ...entry, status });
    toast.success('Status updated');
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Waitlist</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => setFormData(prev => ({ ...prev, status: value as WaitlistStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {editingEntry ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {waitlist.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">No contacts yet</p>
          <p className="text-sm mb-4">Add people interested in your kittens</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Contact
          </Button>
        </div>
      ) : (
        <div className="stat-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 text-sm font-medium text-muted-foreground">Name</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Notes</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground w-20"></th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map(entry => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{entry.name}</td>
                  <td className="py-3">
                    <div className="text-sm">
                      <a href={`mailto:${entry.email}`} className="text-primary hover:underline">{entry.email}</a>
                      {entry.phone && <p className="text-muted-foreground">{entry.phone}</p>}
                    </div>
                  </td>
                  <td className="py-3">
                    <Select
                      value={entry.status}
                      onValueChange={value => handleStatusChange(entry, value as WaitlistStatus)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <Badge className={cn('text-xs', statusColors[entry.status])}>
                          {statusLabels[entry.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 max-w-[200px]">
                    <p className="text-sm text-muted-foreground truncate">{entry.notes || '-'}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(entry)}>
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
                            <AlertDialogTitle>Delete {entry.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteWaitlistEntry(entry.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
