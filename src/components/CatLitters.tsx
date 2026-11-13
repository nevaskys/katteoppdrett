import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Baby, AlertTriangle } from 'lucide-react';

interface Props { catId: string }

export function CatLitters({ catId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['cat-litters', catId],
    queryFn: async () => {
      const { data: litters, error } = await supabase
        .from('litters')
        .select('id, name, status, birth_date, expected_date, mating_date, kitten_count, mother_id, father_id, external_father_name, mother:mother_id(name), father:father_id(name)')
        .or(`mother_id.eq.${catId},father_id.eq.${catId}`);
      if (error) throw error;
      const ids = (litters ?? []).map((l) => l.id);
      let kittens: { litter_id: string; complication_type: string | null }[] = [];
      if (ids.length) {
        const { data: k, error: ke } = await supabase
          .from('kittens').select('litter_id, complication_type').in('litter_id', ids);
        if (ke) throw ke;
        kittens = k ?? [];
      }
      return { litters: litters ?? [], kittens };
    },
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

  return (
    <div className="stat-card">
      <h2 className="text-lg font-semibold mb-4">Kull</h2>
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="rounded-lg bg-muted p-3"><div className="text-2xl font-bold">{born.length}</div><div className="text-xs text-muted-foreground">Kull født</div></div>
        <div className="rounded-lg bg-muted p-3"><div className="text-2xl font-bold">{totalKittens}</div><div className="text-xs text-muted-foreground">Kattunger</div></div>
        <div className="rounded-lg bg-muted p-3"><div className="text-2xl font-bold">{compl.length}</div><div className="text-xs text-muted-foreground">Komplikasjoner</div></div>
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
                        {lc.map((k) => complLabel[k.complication_type!] || k.complication_type && k.complication_type !== 'none').join(', ')}
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
    </div>
  );
}
