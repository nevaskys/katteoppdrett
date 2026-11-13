import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCostEntries, useAddCostEntry, formatKr, COST_CATEGORIES } from '@/hooks/useCostEntries';
import { ReceiptPicker, ReceiptThumbs } from '@/components/economy/ReceiptPicker';
import { cn } from '@/lib/utils';

interface Props {
  litterId: string;
  litterName: string;
}

const emptyForm = { title: '', amount: '', date: new Date().toISOString().slice(0, 10), category: 'veterinær' };

export function LitterCosts({ litterId }: Props) {
  const { data: entries = [] } = useCostEntries();
  const addEntry = useAddCostEntry();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [receipts, setReceipts] = useState<string[]>([]);
  const mine = entries.filter((e) => e.litterId === litterId);

  const ut = mine.filter((e) => e.direction === 'expense').reduce((s, e) => s + e.amount, 0);
  const inn = mine.filter((e) => e.direction === 'income').reduce((s, e) => s + e.amount, 0);
  const diff = inn - ut;

  const submit = () => {
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (!form.title.trim() || !isFinite(amount) || amount <= 0) return;
    addEntry.mutate({
      title: form.title.trim(),
      amount,
      direction: 'expense',
      category: form.category,
      date: form.date || null,
      litterId,
      receiptImages: receipts,
    });
    setForm(emptyForm);
    setReceipts([]);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Økonomi
          </span>
          <span className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Camera className="h-4 w-4 mr-1" /> Kvittering
            </Button>
            <Link
              to="/economy"
              className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              All økonomi <ArrowRight className="h-3 w-3" />
            </Link>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen utgifter registrert på dette kullet ennå.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-[11px] text-muted-foreground">Utgifter</p>
                <p className="text-sm font-semibold text-rose-700">{formatKr(ut)}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-[11px] text-muted-foreground">Inntekter</p>
                <p className="text-sm font-semibold text-emerald-700">{formatKr(inn)}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-[11px] text-muted-foreground">Til overs</p>
                <p className={cn('text-sm font-semibold', diff >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                  {formatKr(diff)}
                </p>
              </div>
            </div>
            <div className="divide-y">
              {mine.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-2 py-1.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">
                      {e.title}
                      <span className="text-xs text-muted-foreground"> · {e.category}</span>
                    </p>
                    <ReceiptThumbs images={e.receiptImages} />
                  </div>
                  <span
                    className={cn(
                      'tabular-nums whitespace-nowrap',
                      e.direction === 'income' ? 'text-emerald-700' : 'text-rose-700',
                    )}
                  >
                    {e.direction === 'income' ? '+' : '-'}
                    {formatKr(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ny utgift med kvittering</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <ReceiptPicker images={receipts} onChange={setReceipts} />
            <div>
              <Label htmlFor="lc-title">Hva</Label>
              <Input id="lc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="F.eks. Vaksine" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lc-amount">Beløp (kr)</Label>
                <Input id="lc-amount" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="lc-date">Dato</Label>
                <Input id="lc-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.filter((c) => c !== 'inntekt').map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={submit} className="w-full">Lagre</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
