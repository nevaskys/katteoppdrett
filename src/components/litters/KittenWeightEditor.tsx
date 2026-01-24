import { useState, useEffect } from 'react';
import { Scale, Loader2, Cat, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DbKitten, useKittensByLitter, useSaveKittens } from '@/hooks/useKittens';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface KittenWeightEditorProps {
  litterId: string;
  birthDate?: string | null;
}

export function KittenWeightEditor({ litterId, birthDate }: KittenWeightEditorProps) {
  const [open, setOpen] = useState(false);
  const [weightDate, setWeightDate] = useState<Date>(new Date());
  const { data: kittens = [], isLoading } = useKittensByLitter(litterId);
  const [weights, setWeights] = useState<Record<string, number | ''>>({});
  const saveKittens = useSaveKittens();

  // Initialize weights and date when dialog opens
  useEffect(() => {
    if (open && kittens.length > 0) {
      const initialWeights: Record<string, number | ''> = {};
      kittens.forEach(k => {
        initialWeights[k.id] = k.birth_weight ?? '';
      });
      setWeights(initialWeights);
      // Default to birth date if available, otherwise today
      if (birthDate) {
        setWeightDate(new Date(birthDate));
      } else {
        setWeightDate(new Date());
      }
    }
  }, [open, kittens, birthDate]);

  const handleSave = () => {
    const kittensToSave = kittens.map(k => {
      const weight = weights[k.id];
      return {
        id: k.id,
        litterId,
        name: k.name || '',
        gender: k.gender as 'male' | 'female' | null,
        color: k.color || '',
        emsCode: k.ems_code || '',
        status: (k.status || 'available') as 'available' | 'reserved' | 'sold' | 'keeping',
        reservedBy: k.reserved_by || '',
        notes: k.notes || '',
        birthWeight: typeof weight === 'number' ? weight : null,
      };
    });

    saveKittens.mutate(
      { litterId, kittens: kittensToSave },
      {
        onSuccess: () => {
          toast.success(`Vekter lagret for ${format(weightDate, 'd. MMM yyyy', { locale: nb })}`);
          setOpen(false);
        },
        onError: () => toast.error('Kunne ikke lagre vekter'),
      }
    );
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'male') return '♂';
    if (gender === 'female') return '♀';
    return '';
  };

  const getGenderColor = (gender: string | null) => {
    if (gender === 'male') return 'text-blue-600';
    if (gender === 'female') return 'text-pink-600';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Scale className="h-4 w-4 mr-2" />
          Registrer vekt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fødselsvekt på kattunger</DialogTitle>
          <DialogDescription>
            Registrer vekten i gram for hver kattunge
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Dato for veiing</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !weightDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {weightDate ? format(weightDate, 'd. MMMM yyyy', { locale: nb }) : <span>Velg dato</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={weightDate}
                onSelect={(date) => date && setWeightDate(date)}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={nb}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : kittens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cat className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Ingen kattunger registrert ennå</p>
            <p className="text-sm mt-1">Gå til Rediger for å legge til kattunger</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kittens.map((kitten, index) => (
              <div key={kitten.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {kitten.name || `Kattunge ${index + 1}`}
                    <span className={`ml-1 ${getGenderColor(kitten.gender)}`}>
                      {getGenderLabel(kitten.gender)}
                    </span>
                  </p>
                  {kitten.color && (
                    <p className="text-xs text-muted-foreground truncate">{kitten.color}</p>
                  )}
                </div>
                <div className="w-24 shrink-0">
                  <Input
                    type="number"
                    value={weights[kitten.id] ?? ''}
                    onChange={(e) => setWeights(prev => ({
                      ...prev,
                      [kitten.id]: e.target.value === '' ? '' : parseInt(e.target.value),
                    }))}
                    placeholder="gram"
                    className="text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saveKittens.isPending || kittens.length === 0}>
            {saveKittens.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
