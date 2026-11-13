import { Link } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCostEntries, formatKr } from '@/hooks/useCostEntries';
import { cn } from '@/lib/utils';

interface Props {
  litterId: string;
  litterName: string;
}

export function LitterCosts({ litterId, litterName }: Props) {
  const { data: entries = [] } = useCostEntries();
  const mine = entries.filter((e) => e.litterId === litterId);
  if (mine.length === 0) return null;

  const ut = mine.filter((e) => e.direction === 'expense').reduce((s, e) => s + e.amount, 0);
  const inn = mine.filter((e) => e.direction === 'income').reduce((s, e) => s + e.amount, 0);
  const diff = inn - ut;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Økonomi
          </span>
          <Link
            to="/economy"
            className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            All økonomi <ArrowRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
            <p
              className={cn(
                'text-sm font-semibold',
                diff >= 0 ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              {formatKr(diff)}
            </p>
          </div>
        </div>
        <div className="divide-y">
          {mine.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
              <span className="truncate">
                {e.title}
                <span className="text-xs text-muted-foreground"> · {e.category}</span>
              </span>
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
        <p className="text-[11px] text-muted-foreground">
          Beløpene er hentet fra notatfilen og kan redigeres på Økonomi-siden.
        </p>
      </CardContent>
    </Card>
  );
}
