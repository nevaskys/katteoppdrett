import { useState } from 'react';
import { Plus, Loader2, Cat, Trash2 } from 'lucide-react';
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
import { DbKitten, useKittensByLitter, useSaveKittens, KittenInput } from '@/hooks/useKittens';
import { toast } from 'sonner';

interface QuickKittenEditorProps {
  litterId: string;
}

interface LocalKitten {
  id: string;
  name: string;
  gender: 'male' | 'female' | null;
  color: string;
  birthWeight: number | null;
}

export function QuickKittenEditor({ litterId }: QuickKittenEditorProps) {
  const [open, setOpen] = useState(false);
  const { data: existingKittens = [], isLoading } = useKittensByLitter(litterId);
  const saveKittens = useSaveKittens();
  const [kittens, setKittens] = useState<LocalKitten[]>([]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setKittens(existingKittens.map(k => ({
        id: k.id,
        name: k.name || '',
        gender: k.gender as 'male' | 'female' | null,
        color: k.color || '',
        birthWeight: k.birth_weight,
      })));
    }
  };

  const addKitten = () => {
    setKittens([...kittens, {
      id: crypto.randomUUID(),
      name: '',
      gender: null,
      color: '',
      birthWeight: null,
    }]);
  };

  const removeKitten = (id: string) => {
    setKittens(kittens.filter(k => k.id !== id));
  };

  const updateKitten = (id: string, updates: Partial<LocalKitten>) => {
    setKittens(kittens.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const handleSave = () => {
    const existingIds = new Set(existingKittens.map(k => k.id));
    
    const kittensToSave: KittenInput[] = kittens.map(k => ({
      id: existingIds.has(k.id) ? k.id : undefined,
      litterId,
      name: k.name,
      gender: k.gender,
      color: k.color,
      emsCode: '',
      status: 'available' as const,
      reservedBy: '',
      notes: '',
      birthWeight: k.birthWeight,
    }));

    saveKittens.mutate(
      { litterId, kittens: kittensToSave },
      {
        onSuccess: () => {
          toast.success('Kattunger oppdatert');
          setOpen(false);
        },
        onError: () => toast.error('Kunne ikke lagre kattunger'),
      }
    );
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'male') return '♂ Hann';
    if (gender === 'female') return '♀ Hunn';
    return 'Ukjent';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Cat className="h-4 w-4 mr-2" />
          Kattunger
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrer kattunger</DialogTitle>
          <DialogDescription>
            Legg til kjønn, farge og vekt for hver kattunge
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {kittens.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Cat className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Ingen kattunger registrert</p>
              </div>
            )}
            
            {kittens.map((kitten, index) => (
              <div key={kitten.id} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {kitten.name || `Kattunge ${index + 1}`}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeKitten(kitten.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Navn</Label>
                    <Input
                      value={kitten.name}
                      onChange={(e) => updateKitten(kitten.id, { name: e.target.value })}
                      placeholder="Kallenavn"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kjønn</Label>
                    <Select
                      value={kitten.gender || 'unknown'}
                      onValueChange={(value) => updateKitten(kitten.id, { 
                        gender: value === 'unknown' ? null : value as 'male' | 'female' 
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Ukjent</SelectItem>
                        <SelectItem value="male">♂ Hann</SelectItem>
                        <SelectItem value="female">♀ Hunn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Farge</Label>
                    <Input
                      value={kitten.color}
                      onChange={(e) => updateKitten(kitten.id, { color: e.target.value })}
                      placeholder="F.eks. Seal point"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vekt (gram)</Label>
                    <Input
                      type="number"
                      value={kitten.birthWeight ?? ''}
                      onChange={(e) => updateKitten(kitten.id, { 
                        birthWeight: e.target.value === '' ? null : parseInt(e.target.value) 
                      })}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKitten}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til kattunge
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saveKittens.isPending}>
            {saveKittens.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
