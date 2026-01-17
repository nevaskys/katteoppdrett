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

  // Prepare chart data
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | null>>();
    
    // Add all dates
    allDates.forEach(date => {
      dateMap.set(date, { date: date as unknown as number });
    });
    
    // Add weights for each kitten
    kittens.forEach(kitten => {
      const kittenName = kitten.name || `Kattunge ${kittens.indexOf(kitten) + 1}`;
      
      allDates.forEach(date => {
        const record = dateMap.get(date)!;
        // Check if it's birth date
        if (date === birthDate && kitten.birth_weight) {
          record[kittenName] = kitten.birth_weight;
        } else {
          const entry = (kitten.weight_log || []).find(e => e.date === date);
          record[kittenName] = entry?.weight || null;
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

  const getKittenLabel = (kitten: DbKitten, index: number) => {
    const name = kitten.name || `Kattunge ${index + 1}`;
    const gender = kitten.gender === 'male' ? '♂' : kitten.gender === 'female' ? '♀' : '';
    return `${name} ${gender}`.trim();
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Diagram</TabsTrigger>
              <TabsTrigger value="table">Tabell</TabsTrigger>
              <TabsTrigger value="register">Registrer</TabsTrigger>
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
