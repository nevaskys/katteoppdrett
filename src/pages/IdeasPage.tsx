import { useState } from 'react';
import { Plus, Lightbulb, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIdeas, useAddIdea, useUpdateIdea, useDeleteIdea, Idea } from '@/hooks/useIdeas';
import { toast } from 'sonner';

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function IdeasPage() {
  const { data: ideas, isLoading } = useIdeas();
  const addIdea = useAddIdea();
  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'new',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      status: 'new',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Tittel er påkrevd');
      return;
    }

    try {
      if (editingId) {
        await updateIdea.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success('Idé oppdatert');
      } else {
        await addIdea.mutateAsync(formData);
        toast.success('Idé lagret');
      }
      resetForm();
    } catch (error) {
      toast.error('Kunne ikke lagre idé');
    }
  };

  const handleEdit = (idea: Idea) => {
    setFormData({
      title: idea.title,
      description: idea.description || '',
      category: idea.category || '',
      priority: idea.priority,
      status: idea.status,
    });
    setEditingId(idea.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIdea.mutateAsync(id);
      toast.success('Idé slettet');
    } catch (error) {
      toast.error('Kunne ikke slette idé');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Ideer
          </h1>
          <p className="text-muted-foreground mt-1">
            Samle og organiser ideene dine for appen
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny idé
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Rediger idé' : 'Ny idé'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Tittel på idéen"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Beskriv idéen din..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Kategori (valgfritt)"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Prioritet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Høy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Lav</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Ny</SelectItem>
                      <SelectItem value="in-progress">Under arbeid</SelectItem>
                      <SelectItem value="done">Ferdig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addIdea.isPending || updateIdea.isPending}>
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? 'Oppdater' : 'Lagre'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {ideas && ideas.length > 0 ? (
        <div className="grid gap-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{idea.title}</h3>
                    {idea.description && (
                      <p className="text-muted-foreground mt-1 text-sm">{idea.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {idea.category && (
                        <Badge variant="outline">{idea.category}</Badge>
                      )}
                      <Badge className={priorityColors[idea.priority]}>
                        {idea.priority === 'high' ? 'Høy' : idea.priority === 'medium' ? 'Medium' : 'Lav'}
                      </Badge>
                      <Badge className={statusColors[idea.status]}>
                        {idea.status === 'new' ? 'Ny' : idea.status === 'in-progress' ? 'Under arbeid' : 'Ferdig'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(idea)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(idea.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Ingen ideer ennå. Klikk "Ny idé" for å legge til din første!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
