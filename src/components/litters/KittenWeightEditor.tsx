import { useState, useEffect } from 'react';
import { Scale, Loader2, Plus, Cat } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DbKitten, useKittensByLitter, useSaveKittens } from '@/hooks/useKittens';
import { toast } from 'sonner';

interface KittenWeightEditorProps {
  litterId: string;
}

export function KittenWeightEditor({ litterId }: KittenWeightEditorProps) {
  const [open, setOpen] = useState(false);
  const { data: kittens = [], isLoading } = useKittensByLitter(litterId);
  const [weights, setWeights] = useState<Record<string, number | ''>>({});
  const saveKittens = useSaveKittens();

  // Initialize weights when dialog opens
  useEffect(() => {
    if (open && kittens.length > 0) {
      const initialWeights: Record<string, number | ''> = {};
      kittens.forEach(k => {
        initialWeights[k.id] = k.birth_weight ?? '';
      });
      setWeights(initialWeights);
    }
  }, [open, kittens]);

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
          toast.success('Vekter lagret');
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
