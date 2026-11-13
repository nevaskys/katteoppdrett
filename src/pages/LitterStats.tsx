import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const days = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
const avg = (n: number[]) => (n.length ? n.reduce((s, x) => s + x, 0) / n.length : null);
const fmt = (n: number | null, d = 1) => (n == null ? '–' : n.toFixed(d).replace('.', ','));

export default function LitterStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['litter-stats'],
    queryFn: async () => {
      const [l, k, c] = await Promise.all([
        supabase.from('litters').select('id,name,mother_id,birth_date,mating_date,mating_date_from,mating_date_to,kitten_count'),
        supabase.from('kittens').select('litter_id,gender,complication_type,birth_weight'),
        supabase.from('cats').select('id,name'),
      ]);
      if (l.error) throw l.error;
      if (k.error) throw k.error;
      if (c.error) throw c.error;
      return { litters: l.data, kittens: k.data, cats: c.data };
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center h-64 items-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const born = data.litters.filter(l => l.birth_date);
  const kittensOf = (id: string) => data.kittens.filter(k => k.litter_id === id);
  const sizeOf = (l: typeof born[number]) => kittensOf(l.id).length || l.kitten_count || 0;
  const gestation = (l: typeof born[number]) => {
    const m = l.mating_date || l.mating_date_from;
    return m && l.birth_date ? days(m, l.birth_date) : null;
  };
  const isComp = (t: string | null) => !!t && t !== 'none';

  const sizes = born.map(sizeOf).filter(n => n > 0);
  const gests = born.map(gestation).filter((n): n is number => n != null && n > 50 && n < 75);
  const allKittens = born.flatMap(l => kittensOf(l.id));
  const comps = allKittens.filter(k => isComp(k.complication_type));
  const weights = allKittens.map(k => k.birth_weight).filter((n): n is number => !!n);

  const gestHist = Object.entries(gests.reduce<Record<number, number>>((a, d) => ({ ...a, [d]: (a[d] || 0) + 1 }), {}))
    .map(([d, n]) => ({ dag: `${d}`, kull: n }));
  const byYear = Object.entries(born.reduce<Record<string, number[]>>((a, l) => {
    const y = l.birth_date!.slice(0, 4); (a[y] ||= []).push(sizeOf(l)); return a;
  }, {})).sort().map(([y, s]) => ({ år: y, snitt: +(avg(s) ?? 0).toFixed(1) }));

  const mothers = data.cats.map(cat => {
    const ls = born.filter(l => l.mother_id === cat.id);
    if (!ls.length) return null;
    const ks = ls.flatMap(l => kittensOf(l.id));
    const g = ls.map(gestation).filter((n): n is number => n != null && n > 50 && n < 75);
    return {
      name: cat.name, kull: ls.length,
      snitt: avg(ls.map(sizeOf)),
      dag: g.length ? `${Math.min(...g)}–${Math.max(...g)}` : '–',
      komp: ks.filter(k => isComp(k.complication_type)).length, total: ks.length,
    };
  }).filter(Boolean) as { name: string; kull: number; snitt: number | null; dag: string; komp: number; total: number }[];

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link to="/litters"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="page-title">Kullstatistikk</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Fødte kull" value={`${born.length}`} />
        <Stat label="Snitt kattunger/kull" value={fmt(avg(sizes))} />
        <Stat label="Snitt drektighet (dager)" value={fmt(avg(gests))} />
        <Stat label="Komplikasjoner" value={allKittens.length ? `${Math.round(comps.length / allKittens.length * 100)} %` : '–'} />
        <Stat label="Hanner / hunner" value={`${allKittens.filter(k => k.gender === 'male').length} / ${allKittens.filter(k => k.gender === 'female').length}`} />
        <Stat label="Snitt fødselsvekt" value={weights.length ? `${Math.round(avg(weights)!)} g` : '–'} />
      </div>
      {gestHist.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Fødselsdag i drektigheten</CardTitle></CardHeader>
          <CardContent className="h-56"><ResponsiveContainer><BarChart data={gestHist}><XAxis dataKey="dag" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="kull" fill="hsl(var(--primary))" radius={4} /></BarChart></ResponsiveContainer></CardContent></Card>
      )}
      {byYear.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Snitt kullstørrelse per år</CardTitle></CardHeader>
          <CardContent className="h-56"><ResponsiveContainer><BarChart data={byYear}><XAxis dataKey="år" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="snitt" fill="hsl(var(--accent))" radius={4} /></BarChart></ResponsiveContainer></CardContent></Card>
      )}
      <Card><CardHeader><CardTitle className="text-base">Per mor</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {mothers.length === 0 && <p className="text-sm text-muted-foreground">Ingen fødte kull med registrert mor ennå.</p>}
          {mothers.map(m => (
            <div key={m.name} className="flex justify-between border-b border-border pb-2 text-sm">
              <span className="font-medium">{m.name}</span>
              <span className="text-muted-foreground text-right">{m.kull} kull · snitt {fmt(m.snitt)} · dag {m.dag} · {m.komp}/{m.total} komplikasjoner</span>
            </div>
          ))}
        </CardContent></Card>
    </div>
  );
}
