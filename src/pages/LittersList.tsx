import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Loader2, BarChart3, ChevronDown, ChevronRight, Baby, ArrowUpDown } from 'lucide-react';
import { useLittersGrouped } from '@/hooks/useLittersNew';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LitterStatusBadge } from '@/components/litters/LitterStatusBadge';
import { Litter, LitterStatus } from '@/types/litter';
import { Cat } from '@/types';

type SortKey = 'year_desc' | 'year_asc' | 'mother' | 'name';
type StatusFilter = 'all' | LitterStatus;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'year_desc', label: 'Nyeste først' },
  { value: 'year_asc', label: 'Eldste først' },
  { value: 'mother', label: 'Hunnkatt A–Å' },
  { value: 'name', label: 'Kullnavn A–Å' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Alle statuser' },
  { value: 'planned', label: 'Planlagt' },
  { value: 'pending', label: 'Ventende' },
  { value: 'active', label: 'Aktivt' },
  { value: 'completed', label: 'Ferdig' },
];

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('nb-NO') : '');
const litterDate = (l: Litter) => l.birthDate || l.expectedDate || l.matingDateFrom || l.matingDate || l.createdAt;
const litterYear = (l: Litter) => {
  const d = litterDate(l);
  return d ? new Date(d).getFullYear() : 0;
};

export default function LittersList() {
  const { data: littersGrouped, isLoading: littersLoading } = useLittersGrouped();
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const [sort, setSort] = useState<SortKey>('year_desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());

  const catName = (id: string | null) => cats.find((c: Cat) => c.id === id)?.name;

  const litters = useMemo(() => {
    let list = [...(littersGrouped?.all ?? [])];
    if (statusFilter !== 'all') list = list.filter((l) => l.status === statusFilter);
    const byMother = (l: Litter) => (catName(l.motherId) || 'ÿ').toLowerCase();
    switch (sort) {
      case 'year_desc':
        list.sort((a, b) => litterDate(b).localeCompare(litterDate(a)));
        break;
      case 'year_asc':
        list.sort((a, b) => litterDate(a).localeCompare(litterDate(b)));
        break;
      case 'mother':
        list.sort((a, b) => byMother(a).localeCompare(byMother(b), 'nb') || litterDate(b).localeCompare(litterDate(a)));
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'nb'));
        break;
    }
    return list;
  }, [littersGrouped, statusFilter, sort, cats]);

  const byYear = useMemo(() => {
    if (sort === 'mother' || sort === 'name') return null; // flat list when sorting alphabetically
    const map = new Map<number, Litter[]>();
    for (const l of litters) {
      const y = litterYear(l);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(l);
    }
    return [...map.entries()];
  }, [litters, sort]);

  if (littersLoading || catsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalLitters = littersGrouped?.all?.length || 0;

  const toggleYear = (y: number) =>
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(y)) next.delete(y); else next.add(y);
      return next;
    });

  const renderRow = (l: Litter) => {
    const mother = catName(l.motherId) || 'Ukjent mor';
    const father = catName(l.fatherId) || l.externalFatherName || 'Ukjent far';
    return (
      <li key={l.id}>
        <Link
          to={`/litters/${l.id}`}
          className="flex items-center gap-3 py-2.5 px-2 min-h-[44px] hover:bg-muted/50 rounded-md"
        >
          <Baby className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{l.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {mother} × {father}
            </div>
          </div>
          <div className="hidden sm:block text-sm text-muted-foreground w-24 shrink-0 text-right">
            {fmt(litterDate(l))}
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground w-16 shrink-0 justify-end">
            <Baby className="h-3.5 w-3.5" />
            {l.kittenCount ?? '–'}
          </div>
          <div className="shrink-0">
            <LitterStatusBadge status={l.status} />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kull</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administrer kull fra planlegging til ferdig
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/litters/stats"><BarChart3 className="h-4 w-4 mr-2" /> Statistikk</Link>
          </Button>
          <Button asChild>
            <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Nytt kull</Link>
          </Button>
        </div>
      </div>

      {totalLitters === 0 ? (
        <div className="empty-state">
          <Users className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Ingen kull ennå</p>
          <p className="text-sm mb-4">Start med å planlegge ditt første kull</p>
          <Button asChild>
            <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Nytt kull</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {litters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen kull matcher filteret.</p>
          ) : byYear ? (
            <div className="space-y-4">
              {byYear.map(([year, yearLitters]) => {
                const collapsed = collapsedYears.has(year);
                return (
                  <div key={year} className="stat-card">
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center gap-2 text-left group mb-1"
                    >
                      {collapsed ? (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {year || 'Uten dato'}
                      </h2>
                      <span className="text-sm text-muted-foreground">({yearLitters.length})</span>
                    </button>
                    {!collapsed && (
                      <ul className="divide-y divide-border">
                        {yearLitters.map(renderRow)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="stat-card">
              <ul className="divide-y divide-border">
                {litters.map(renderRow)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
