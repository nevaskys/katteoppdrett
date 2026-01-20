import { useState } from 'react';
import { MessageSquarePlus, Send, Clock, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSuggestions, useAddSuggestion, useUpdateSuggestionStatus, useDeleteSuggestion } from '@/hooks/useSuggestions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const categories = [
  { value: 'feature', label: 'Ny funksjon' },
  { value: 'improvement', label: 'Forbedring' },
  { value: 'bug', label: 'Feil/Problem' },
  { value: 'general', label: 'Generelt' },
];

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Ny', icon: Clock, variant: 'secondary' },
  reviewing: { label: 'Under vurdering', icon: Clock, variant: 'default' },
  planned: { label: 'Planlagt', icon: CheckCircle2, variant: 'default' },
  completed: { label: 'Fullført', icon: CheckCircle2, variant: 'default' },
  rejected: { label: 'Avvist', icon: XCircle, variant: 'destructive' },
};

export default function SuggestionsPage() {
  const { data: suggestions = [], isLoading } = useSuggestions();
  const { mutate: addSuggestion, isPending: isAdding } = useAddSuggestion();
  const { mutate: updateStatus } = useUpdateSuggestionStatus();
  const { mutate: deleteSuggestion } = useDeleteSuggestion();
  const { isAdmin } = useIsAdmin();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    addSuggestion(formData, {
      onSuccess: () => {
        setFormData({ title: '', description: '', category: 'general' });
        setShowForm(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forslag & Tilbakemeldinger</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Administrer forslag fra brukere' 
              : 'Send inn forslag til forbedringer eller rapporter problemer'}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Nytt forslag
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Send inn forslag</CardTitle>
            <CardDescription>
              Beskriv hva du ønsker forbedret eller hva som mangler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tittel</label>
                <Input
                  placeholder="Kort beskrivelse av forslaget"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Beskrivelse (valgfritt)</label>
                <Textarea
                  placeholder="Utdyp forslaget ditt..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send inn
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && !showForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Ingen forslag ennå. Klikk "Nytt forslag" for å sende inn ditt første!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const status = statusConfig[suggestion.status || 'new'] || statusConfig.new;
            const StatusIcon = status.icon;
            const category = categories.find(c => c.value === suggestion.category);
            
            return (
              <Card key={suggestion.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <Badge variant="outline">{category?.label || 'Generelt'}</Badge>
                        <Badge variant={status.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      
                      {suggestion.description && (
                        <p className="text-muted-foreground text-sm">
                          {suggestion.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Sendt {format(new Date(suggestion.created_at), 'd. MMMM yyyy', { locale: nb })}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={suggestion.status || 'new'}
                          onValueChange={(status) => updateStatus({ id: suggestion.id, status })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSuggestion(suggestion.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
