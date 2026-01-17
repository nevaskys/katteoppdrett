import { useState, useMemo } from 'react';
import { Scale, Plus, Trash2, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DbKitten, WeightEntry, useKittensByLitter } from '@/hooks/useKittens';
import { useUpdateKittenWeights } from '@/hooks/useKittenWeights';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface KittenWeightTrackerProps {
  litterId: string;
  birthDate?: string | null;
}

// Colors for each kitten line in the chart
const KITTEN_COLORS = [
  '#ef4444', // red
  '#a855f7', // purple
  '#000000', // black
  '#f97316', // orange
  '#22c55e', // green
  '#78716c', // brown
  '#3b82f6', // blue
  '#ec4899', // pink
];

export function KittenWeightTracker({ litterId, birthDate }: KittenWeightTrackerProps) {
  const [open, setOpen] = useState(false);
  const { data: kittens = [], isLoading } = useKittensByLitter(litterId);
  const updateWeights = useUpdateKittenWeights();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [weights, setWeights] = useState<Record<string, number | ''>>({});

  // Get all unique dates from all kittens' weight logs
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    kittens.forEach(kitten => {
      (kitten.weight_log || []).forEach(entry => {
        dates.add(entry.date);
      });
      // Also add birth date with birth weight
      if (birthDate && kitten.birth_weight) {
        dates.add(birthDate);
      }
    });
    return Array.from(dates).sort();
  }, [kittens, birthDate]);

  // Helper to get consistent kitten label
  const getKittenLabel = (kitten: DbKitten, index: number) => {
    const name = kitten.name || `Kattunge ${index + 1}`;
    const gender = kitten.gender === 'male' ? '♂' : kitten.gender === 'female' ? '♀' : '';
    return `${name} ${gender}`.trim();
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | null>>();
    
    // Add all dates
    allDates.forEach(date => {
      dateMap.set(date, { date: date as unknown as number });
    });
    
    // Add weights for each kitten
    kittens.forEach((kitten, index) => {
      const kittenLabel = getKittenLabel(kitten, index);
      
      allDates.forEach(date => {
        const record = dateMap.get(date)!;
        // Check if it's birth date
        if (date === birthDate && kitten.birth_weight) {
          record[kittenLabel] = kitten.birth_weight;
        } else {
          const entry = (kitten.weight_log || []).find(e => e.date === date);
          record[kittenLabel] = entry?.weight || null;
        }
      });
    });
    
    return Array.from(dateMap.values());
  }, [kittens, allDates, birthDate]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Initialize weights for today
      const today = format(new Date(), 'yyyy-MM-dd');
      setSelectedDate(today);
      const initialWeights: Record<string, number | ''> = {};
      kittens.forEach(kitten => {
        const todayEntry = (kitten.weight_log || []).find(e => e.date === today);
        initialWeights[kitten.id] = todayEntry?.weight ?? '';
      });
      setWeights(initialWeights);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const newWeights: Record<string, number | ''> = {};
    kittens.forEach(kitten => {
      const entry = (kitten.weight_log || []).find(e => e.date === date);
      newWeights[kitten.id] = entry?.weight ?? '';
    });
    setWeights(newWeights);
  };

  const handleSaveWeights = () => {
    const updates = kittens.map(kitten => {
      const currentLog = kitten.weight_log || [];
      const newWeight = weights[kitten.id];
      
      // Remove existing entry for this date
      const filteredLog = currentLog.filter(e => e.date !== selectedDate);
      
      // Add new entry if weight is provided
      if (newWeight !== '' && newWeight !== undefined) {
        filteredLog.push({ date: selectedDate, weight: Number(newWeight) });
      }
      
      // Sort by date
      filteredLog.sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        kittenId: kitten.id,
        weightLog: filteredLog,
      };
    });

    updateWeights.mutate(updates, {
      onSuccess: () => {
        toast.success('Vekter oppdatert');
      },
      onError: () => {
        toast.error('Kunne ikke lagre vekter');
      },
    });
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: nb });
    } catch {
      return dateStr;
    }
  };

  if (kittens.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Scale className="h-4 w-4 mr-2" />
          Vektutvikling
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vektutvikling for kattunger
          </DialogTitle>
          <DialogDescription>
            Registrer daglig vekt for å følge utviklingen
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="chart" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chart">Diagram</TabsTrigger>
              <TabsTrigger value="table">Tabell</TabsTrigger>
              <TabsTrigger value="register">Registrer</TabsTrigger>
              <TabsTrigger value="guide">Veiledning</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              {chartData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <Scale className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Ingen vektdata registrert ennå</p>
                  <p className="text-sm">Gå til "Registrer" for å legge inn vekter</p>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDateLabel}
                        className="text-xs"
                      />
                      <YAxis 
                        label={{ value: 'Vekt (gram)', angle: -90, position: 'insideLeft' }}
                        className="text-xs"
                      />
                      <Tooltip 
                        labelFormatter={formatDateLabel}
                        formatter={(value: number) => [`${value}g`, '']}
                      />
                      <Legend />
                      {kittens.map((kitten, index) => (
                        <Line
                          key={kitten.id}
                          type="monotone"
                          dataKey={getKittenLabel(kitten, index)}
                          stroke={KITTEN_COLORS[index % KITTEN_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              {allDates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <Scale className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Ingen vektdata registrert ennå</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Dato</TableHead>
                        {kittens.map((kitten, index) => (
                          <TableHead 
                            key={kitten.id} 
                            className="text-center"
                            style={{ 
                              backgroundColor: `${KITTEN_COLORS[index % KITTEN_COLORS.length]}20`,
                            }}
                          >
                            {getKittenLabel(kitten, index)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDates.map(date => (
                        <TableRow key={date}>
                          <TableCell className="font-medium">
                            {formatDateLabel(date)}
                          </TableCell>
                          {kittens.map((kitten, index) => {
                            let weight: number | null = null;
                            if (date === birthDate && kitten.birth_weight) {
                              weight = kitten.birth_weight;
                            } else {
                              const entry = (kitten.weight_log || []).find(e => e.date === date);
                              weight = entry?.weight || null;
                            }
                            return (
                              <TableCell 
                                key={kitten.id} 
                                className="text-center"
                                style={{ 
                                  backgroundColor: `${KITTEN_COLORS[index % KITTEN_COLORS.length]}10`,
                                }}
                              >
                                {weight ? `${weight}g` : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label>Dato</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kittens.map((kitten, index) => (
                  <div 
                    key={kitten.id} 
                    className="p-3 border rounded-lg space-y-2"
                    style={{ 
                      borderColor: KITTEN_COLORS[index % KITTEN_COLORS.length],
                      borderWidth: '2px',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: KITTEN_COLORS[index % KITTEN_COLORS.length] }}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {getKittenLabel(kitten, index)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Vekt i gram"
                        value={weights[kitten.id] ?? ''}
                        onChange={(e) => setWeights(prev => ({
                          ...prev,
                          [kitten.id]: e.target.value === '' ? '' : parseInt(e.target.value),
                        }))}
                        className="h-9"
                      />
                      <span className="text-sm text-muted-foreground">g</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleSaveWeights} 
                disabled={updateWeights.isPending}
                className="w-full sm:w-auto"
              >
                {updateWeights.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Lagre vekter for {formatDateLabel(selectedDate)}
              </Button>
            </TabsContent>

            <TabsContent value="guide" className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🐱 Normal fødselsvekt – Sibirsk katt / Neva Masquerade
                  </h3>
                  <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                    <li><strong>Normal:</strong> 90–120 g</li>
                    <li><strong>Helt greit:</strong> 80–130 g</li>
                    <li className="text-amber-700 dark:text-amber-400"><strong>Obs:</strong> &lt; 75–80 g → følg ekstra tett</li>
                    <li className="text-muted-foreground">135–140 g → ofte store linjer / få kullsøsken</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Hannkatter er ofte litt tyngre enn hunner allerede ved fødsel, men ikke alltid.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    📈 Vektøkning – det viktigste å følge med på
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">🔹 Per døgn (første 2 uker)</h4>
                      <ul className="space-y-1 text-green-700 dark:text-green-300">
                        <li><strong>Minimum:</strong> +8–10 g</li>
                        <li><strong>Ideelt:</strong> +10–15 g</li>
                        <li className="text-red-600 dark:text-red-400"><strong>Varsel:</strong> 0 g økning eller vektnedgang → må følges opp umiddelbart</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        👉 En kattunge skal øke hver eneste dag de første 10–14 dagene.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">🔹 Per uke</h4>
                      <ul className="space-y-1 text-green-700 dark:text-green-300">
                        <li><strong>Tommelregel:</strong> ≈ 100 g per uke</li>
                        <li>Uke 1: +70–100 g</li>
                        <li>Uke 2: +90–120 g</li>
                        <li>Uke 3–4: +100–150 g</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">📊 Veiledende vektkurve (Sibir / Neva)</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium">Alder</th>
                          <th className="text-left py-2 font-medium">Ca. vekt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr><td className="py-1.5 pr-4">Fødsel</td><td>90–120 g</td></tr>
                        <tr><td className="py-1.5 pr-4">1 uke</td><td>180–220 g</td></tr>
                        <tr><td className="py-1.5 pr-4">2 uker</td><td>280–350 g</td></tr>
                        <tr><td className="py-1.5 pr-4">3 uker</td><td>380–500 g</td></tr>
                        <tr><td className="py-1.5 pr-4">4 uker</td><td>480–650 g</td></tr>
                        <tr><td className="py-1.5 pr-4">5 uker</td><td>600–800 g</td></tr>
                        <tr><td className="py-1.5 pr-4">8 uker</td><td>1,0–1,3 kg</td></tr>
                        <tr><td className="py-1.5 pr-4">12 uker</td><td>1,5–2,0+ kg</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Neva følger samme kurve som Sibir – fargen spiller ingen rolle, linjene gjør.
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    🚨 Når bør du reagere?
                  </h3>
                  <ul className="text-sm space-y-1 text-red-800 dark:text-red-200">
                    <li>• Kattungen ikke legger på seg ett døgn</li>
                    <li>• Vekten øker &lt; 7–8 g/døgn flere dager på rad</li>
                    <li>• Én kattunge konsekvent henger 20–30 % bak søsken</li>
                  </ul>
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100">Tiltak:</p>
                    <ul className="text-red-700 dark:text-red-300 space-y-1">
                      <li>• Sjekke at den faktisk får die</li>
                      <li>• Veie før/etter mating</li>
                      <li>• Evt. støttefôring tidlig (ikke vente)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    💡 Pro tips (som redder kull)
                  </h3>
                  <ul className="text-sm space-y-1 text-amber-800 dark:text-amber-200">
                    <li>• Vei samme tidspunkt hver dag</li>
                    <li>• Noter i gram (ikke "cirka")</li>
                    <li>• Se på trend, ikke bare enkeltmålinger</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
