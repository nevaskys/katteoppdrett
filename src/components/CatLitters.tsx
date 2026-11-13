import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronRight, Baby, AlertTriangle } from 'lucide-react';

interface Props { catId: string }

interface CompKitten {
  id: string;
  litter_id: string;
  name: string | null;
  gender: string | null;
  complication_type: string | null;
  notes: string | null;
}

export function CatLitters({ catId }: Props) {
  const queryClient = useQueryClient();
  const [complOpen, setComplOpen] = useState(false);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['cat-litters', catId],
    queryFn: async () => {
      const { data: litters, error } = await supabase
        .from('litters')
        .select('id, name, status, birth_date, expected_date, mating_date, kitten_count, mother_id, father_id, external_father_name, mother:mother_id(name), father:father_id(name)')
        .or(`mother_id.eq.${catId},father_id.eq.${catId}`);
      if (error) throw error;
      const ids = (litters ?? []).map((l) => l.id);
      let kittens: CompKitten[] = [];
      if (ids.length) {
        const { data: k, error: ke } = await supabase
          .from('kittens').select('id, litter_id, name, gender, complication_type, notes').in('litter_id', ids);
        if (ke) throw ke;
        kittens = (k ?? []) as CompKitten[];
      }
      return { litters: litters ?? [], kittens };
    },
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from('kittens').update({ notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cat-litters', catId] });
      toast.success('Notat lagret');
    },
    onError: () => toast.error('Kunne ikke lagre notatet'),
  });

  if (isLoading) return null;
  const litters = [...(data?.litters ?? [])].sort((a, b) =>
    (b.birth_date || b.expected_date || b.mating_date || '').localeCompare(a.birth_date || a.expected_date || a.mating_date || ''));
  const kittens = data?.kittens ?? [];
  const compl = kittens.filter((k) => k.complication_type && k.complication_type !== 'none');
  const born = litters.filter((l) => l.birth_date);
  const totalKittens = born.reduce((s, l) => {
    const n = kittens.filter((k) => k.litter_id === l.id).length;
    return s + (n || l.kitten_count || 0);
  }, 0);
  const complLabel: Record<string, string> = { stillborn: 'Dødfødt', died: 'Død', complication: 'Komplikasjon' };
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('nb-NO') : '');
  const litterName = (id: string) => litters.find((l) => l.id === id)?.name ?? '';

  return (
    <div className="stat-card">
      <h2 className="text-lg font-semibold mb-4">Kull</h2>
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="rounded-lg bg-muted p-3"><div className="text-2xl font-bold">{born.length}</div><div className="text-xs text-muted-foreground">Kull født</div></div>
        <div className="rounded-lg bg-muted p-3"><div className="text-2xl font-bold">{totalKittens}</div><div className="text-xs text-muted-foreground">Kattunger</div></div>
        <button
          type="button"
          onClick={() => compl.length > 0 && setComplOpen(true)}
          className={`rounded-lg bg-muted p-3 min-h-[44px] transition-colors ${compl.length > 0 ? 'hover:bg-muted/70 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="text-2xl font-bold">{compl.length}</div>
          <div className="text-xs text-muted-foreground">Komplikasjoner</div>
        </button>
      </div>
      {litters.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen kull registrert.</p>
      ) : (
        <ul className="divide-y divide-border">
          {litters.map((l: any) => {
            const lk = kittens.filter((k) => k.litter_id === l.id);
            const lc = lk.filter((k) => k.complication_type && k.complication_type !== 'none');
            const partner = l.mother_id === catId ? (l.father?.name || l.external_father_name) : l.mother?.name;
            return (
              <li key={l.id}>
                <Link to={`/litters/${l.id}`} className="flex items-center gap-3 py-3 min-h-[44px] hover:bg-muted/50 rounded-md px-2">
                  <Baby className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[fmt(l.birth_date || l.expected_date || l.mating_date), partner && `med ${partner}`, `${lk.length || l.kitten_count || 0} kattunger`].filter(Boolean).join(' · ')}
                    </div>
                    {lc.length > 0 && (
                      <div className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        {lc.map((k) => complLabel[k.complication_type!] || k.complication_type).join(', ')}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">{l.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={complOpen} onOpenChange={setComplOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Komplikasjoner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {compl.map((k) => {
              const current = draftNotes[k.id] ?? k.notes ?? '';
              const dirty = draftNotes[k.id] !== undefined && draftNotes[k.id] !== (k.notes ?? '');
              return (
                <div key={k.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="font-medium">{k.name || 'Navnløs kattunge'}</span>
                    <Badge variant="destructive">{complLabel[k.complication_type!] || k.complication_type}</Badge>
                    <Link
                      to={`/litters/${k.litter_id}`}
                      className="text-xs text-primary hover:underline ml-auto"
                      onClick={() => setComplOpen(false)}
                    >
                      {litterName(k.litter_id)}
                    </Link>
                  </div>
                  <Textarea
                    value={current}
                    onChange={(e) => setDraftNotes((d) => ({ ...d, [k.id]: e.target.value }))}
                    placeholder="Skriv notater om komplikasjonen ..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!dirty || saveNotes.isPending}
                      onClick={() => saveNotes.mutate({ id: k.id, notes: current })}
                    >
                      Lagre notat
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
