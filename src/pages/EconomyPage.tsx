import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useCostEntries,
  useAddCostEntry,
  useDeleteCostEntry,
  COST_CATEGORIES,
  formatKr,
} from '@/hooks/useCostEntries';
import { useLittersGrouped } from '@/hooks/useLittersNew';
import { cn } from '@/lib/utils';

export default function EconomyPage() {
  const { t } = useTranslation();
  const { data: entries = [], isLoading } = useCostEntries();
  const { data: grouped } = useLittersGrouped();
  const litters = useMemo(() => grouped?.all ?? [], [grouped]);
  const addEntry = useAddCostEntry();
  const deleteEntry = useDeleteCostEntry();

  const [year, setYear] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [direction, setDirection] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    direction: 'expense' as 'expense' | 'income',
    category: 'annet',
    date: '',
    description: '',
    litterId: '',
  });

  const litterName = useMemo(() => {
    const m = new Map<string, string>();
    litters.forEach((l) => m.set(l.id, l.name));
    return m;
  }, [litters]);

  const years = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => {
      if (e.date) s.add(e.date.slice(0, 4));
    });
    return Array.from(s).sort().reverse();
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (year !== 'all' && (!e.date || e.date.slice(0, 4) !== year)) return false;
        if (category !== 'all' && e.category !== category) return false;
        if (direction !== 'all' && e.direction !== direction) return false;
        return true;
      }),
    [entries, year, category, direction],
  );

  const totals = useMemo(() => {
    const ut = filtered.filter((e) => e.direction === 'expense').reduce((s, e) => s + e.amount, 0);
    const inn = filtered.filter((e) => e.direction === 'income').reduce((s, e) => s + e.amount, 0);
    return { ut, inn, diff: inn - ut };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    filtered
      .filter((e) => e.direction === 'expense')
      .forEach((e) => m.set(e.category, (m.get(e.category) || 0) + e.amount));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const byLitter = useMemo(() => {
    const m = new Map<string, { ut: number; inn: number }>();
    filtered
      .filter((e) => e.litterId)
      .forEach((e) => {
        const cur = m.get(e.litterId!) || { ut: 0, inn: 0 };
        if (e.direction === 'expense') cur.ut += e.amount;
        else cur.inn += e.amount;
        m.set(e.litterId!, cur);
      });
    return Array.from(m.entries()).sort((a, b) => b[1].ut - a[1].ut);
  }, [filtered]);

  const maxCat = byCategory[0]?.[1] || 1;

  const submit = () => {
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (!form.title.trim() || !isFinite(amount) || amount <= 0) return;
    addEntry.mutate({
      title: form.title.trim(),
      amount,
      direction: form.direction,
      category: form.direction === 'income' ? 'inntekt' : form.category,
      date: form.date || null,
      description: form.description.trim() || null,
      litterId: form.litterId || null,
    });
    setForm({ title: '', amount: '', direction: 'expense', category: 'annet', date: '', description: '', litterId: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          {t('nav.economy')}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" /> Ny
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Legge til en post</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ce-title">Hva</Label>
                <Input
                  id="ce-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="F.eks. Royal Canin"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ce-amount">Beløp (kr)</Label>
                  <Input
                    id="ce-amount"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ce-date">Dato</Label>
                  <Input
                    id="ce-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Retning</Label>
                  <Select
                    value={form.direction}
                    onValueChange={(v) =>
                      setForm({ ...form, direction: v as 'expense' | 'income' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Utgift</SelectItem>
                      <SelectItem value="income">Inntekt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                    disabled={form.direction === 'income'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_CATEGORIES.filter((c) => c !== 'inntekt').map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Knytting til kull</Label>
                <Select
                  value={form.litterId || 'none'}
                  onValueChange={(v) => setForm({ ...form, litterId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ikke knyttet</SelectItem>
                    {litters.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ce-desc">Notat</Label>
                <Textarea
                  id="ce-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Button onClick={submit} className="w-full">
                Lagre
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="År" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle år</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Ut og inn</SelectItem>
            <SelectItem value="expense">Utgifter</SelectItem>
            <SelectItem value="income">Inntekter</SelectItem>
          </SelectContent>
        </Select>
        <div className="col-span-2 sm:col-span-1">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {COST_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Utgifter</p>
            <p className="text-lg sm:text-2xl font-semibold text-rose-700">{formatKr(totals.ut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inntekter</p>
            <p className="text-lg sm:text-2xl font-semibold text-emerald-700">{formatKr(totals.inn)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Til overs</p>
            <p
              className={cn(
                'text-lg sm:text-2xl font-semibold',
                totals.diff >= 0 ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {formatKr(totals.diff)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {byCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fordeling av utgiftene</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byCategory.map(([cat, sum]) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{cat}</span>
                  <span className="tabular-nums text-muted-foreground">{formatKr(sum)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary/70"
                    style={{ width: `${Math.max(2, (sum / maxCat) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per litter */}
      {byLitter.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Per kull</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {byLitter.map(([id, v]) => (
                <Link
                  key={id}
                  to={`/litters/${id}`}
                  className="flex items-center justify-between py-2 text-sm hover:bg-accent/50 rounded px-1 -mx-1"
                >
                  <span className="font-medium">{litterName.get(id) || 'Kull'}</span>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span className="text-rose-700">-{formatKr(v.ut)}</span>
                    <span className="text-emerald-700">+{formatKr(v.inn)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filtered.length} poster
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laster…</p>
          ) : (
            <div className="divide-y">
              {filtered.slice(0, 400).map((e) => (
                <div key={e.id} className="flex items-start gap-2 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(e.date || e.dateLabel || '') +
                        (e.category ? ` · ${e.category}` : '') +
                        (e.litterId && litterName.get(e.litterId)
                          ? ` · ${litterName.get(e.litterId)}`
                          : '')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-sm tabular-nums whitespace-nowrap',
                      e.direction === 'income' ? 'text-emerald-700' : 'text-rose-700',
                    )}
                  >
                    {e.direction === 'income' ? '+' : '-'}
                    {formatKr(e.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => deleteEntry.mutate(e.id)}
                    aria-label="Slett"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {filtered.length > 400 && (
                <p className="pt-2 text-xs text-muted-foreground">
                  Viser de 400 første — filtrer for å se flere.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
