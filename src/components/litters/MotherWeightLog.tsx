import { useState } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Plus, Trash2, Scale, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MotherWeightEntry } from '@/types/litter';
import { cn } from '@/lib/utils';

interface MotherWeightLogProps {
  entries: MotherWeightEntry[];
  onChange: (entries: MotherWeightEntry[]) => void;
  readOnly?: boolean;
}

export function MotherWeightLog({ entries, onChange, readOnly = false }: MotherWeightLogProps) {
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleAdd = () => {
    if (!newWeight || !newDate) return;

    const entry: MotherWeightEntry = {
      id: crypto.randomUUID(),
      date: newDate,
      weight: parseFloat(newWeight),
      notes: newNotes || undefined,
    };

    onChange([...entries, entry]);
    setNewWeight('');
    setNewNotes('');
    setNewDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleDelete = (id: string) => {
    onChange(entries.filter(e => e.id !== id));
  };

  // Calculate weight change
  const getWeightChange = (currentIndex: number) => {
    if (currentIndex >= sortedEntries.length - 1) return null;
    const current = sortedEntries[currentIndex];
    const previous = sortedEntries[currentIndex + 1];
    const change = current.weight - previous.weight;
    return change;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Scale className="h-4 w-4" />
        <span>Vektutvikling hos mor</span>
      </div>

      {!readOnly && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="weightDate" className="text-xs">Dato</Label>
              <Input
                id="weightDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weight" className="text-xs">Vekt (gram)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="3500"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label htmlFor="weightNotes" className="text-xs">Notater</Label>
              <Input
                id="weightNotes"
                placeholder="Valgfritt"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-end col-span-2 sm:col-span-1">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!newWeight || !newDate}
                size="sm"
                className="w-full h-9"
              >
                <Plus className="h-4 w-4 mr-1" />
                Legg til
              </Button>
            </div>
          </div>
        </div>
      )}

      {sortedEntries.length > 0 ? (
        <div className="space-y-2">
          {sortedEntries.map((entry, index) => {
            const change = getWeightChange(index);
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 p-3 bg-card border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {format(new Date(entry.date), 'd. MMM', { locale: nb })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.weight}g</span>
                    {change !== null && (
                      <span className={cn(
                        "text-xs flex items-center gap-0.5",
                        change > 0 && "text-green-600 dark:text-green-400",
                        change < 0 && "text-red-600 dark:text-red-400",
                        change === 0 && "text-muted-foreground"
                      )}>
                        {change > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            +{change}g
                          </>
                        ) : change < 0 ? (
                          <>{change}g</>
                        ) : (
                          <>±0g</>
                        )}
                      </span>
                    )}
                  </div>
                  {entry.notes && (
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.notes}
                    </span>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Ingen vektregistreringer ennå
        </p>
      )}
    </div>
  );
}
