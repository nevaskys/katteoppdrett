import { useState, useEffect } from 'react';
import { Plus, Trash2, Cat } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface KittenData {
  id: string;
  name: string;
  gender: 'male' | 'female' | null;
  color: string;
  emsCode: string;
  status: 'available' | 'reserved' | 'sold' | 'keeping';
  reservedBy: string;
  notes: string;
}

interface KittenEditorProps {
  kittens: KittenData[];
  onChange: (kittens: KittenData[]) => void;
  suggestedCount?: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Tilgjengelig', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  reserved: { label: 'Reservert', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  sold: { label: 'Solgt', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  keeping: { label: 'Beholder', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
};

export function KittenEditor({ kittens, onChange, suggestedCount }: KittenEditorProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-create kittens based on suggested count
  useEffect(() => {
    if (suggestedCount && suggestedCount > 0 && kittens.length < suggestedCount) {
      const newKittens: KittenData[] = [...kittens];
      for (let i = kittens.length; i < suggestedCount; i++) {
        newKittens.push(createEmptyKitten(i + 1));
      }
      onChange(newKittens);
    }
  }, [suggestedCount]);

  const createEmptyKitten = (number: number): KittenData => ({
    id: crypto.randomUUID(),
    name: '',
    gender: null,
    color: '',
    emsCode: '',
    status: 'available',
    reservedBy: '',
    notes: '',
  });

  const addKitten = () => {
    const newKitten = createEmptyKitten(kittens.length + 1);
    onChange([...kittens, newKitten]);
    setExpanded({ ...expanded, [newKitten.id]: true });
  };

  const removeKitten = (id: string) => {
    onChange(kittens.filter(k => k.id !== id));
    const newExpanded = { ...expanded };
    delete newExpanded[id];
    setExpanded(newExpanded);
  };

  const updateKitten = (id: string, updates: Partial<KittenData>) => {
    onChange(kittens.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const toggleExpanded = (id: string) => {
    setExpanded({ ...expanded, [id]: !expanded[id] });
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'male') return '♂ Hann';
    if (gender === 'female') return '♀ Hunn';
    return 'Ukjent';
  };

  const getGenderColor = (gender: string | null) => {
    if (gender === 'male') return 'text-blue-600';
    if (gender === 'female') return 'text-pink-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Kattunger ({kittens.length})</h4>
          <p className="text-xs text-muted-foreground">
            Registrer detaljer for hver kattunge
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addKitten}>
          <Plus className="h-4 w-4 mr-1" />
          Legg til
        </Button>
      </div>

      {kittens.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Cat className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Ingen kattunger registrert ennå
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addKitten}>
            <Plus className="h-4 w-4 mr-1" />
            Legg til første kattunge
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {kittens.map((kitten, index) => (
          <Card key={kitten.id} className="overflow-hidden">
            <CardHeader 
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(kitten.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-sm">
                      {kitten.name || `Kattunge ${index + 1}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${getGenderColor(kitten.gender)}`}>
                        {getGenderLabel(kitten.gender)}
                      </span>
                      {kitten.color && (
                        <span className="text-xs text-muted-foreground">• {kitten.color}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={STATUS_LABELS[kitten.status]?.color}>
                    {STATUS_LABELS[kitten.status]?.label}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKitten(kitten.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {expanded[kitten.id] && (
              <CardContent className="p-4 pt-0 border-t bg-muted/30">
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Navn</Label>
                    <Input
                      value={kitten.name}
                      onChange={(e) => updateKitten(kitten.id, { name: e.target.value })}
                      placeholder="Kattungens navn"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Kjønn</Label>
                    <Select
                      value={kitten.gender || 'unknown'}
                      onValueChange={(value) => updateKitten(kitten.id, { 
                        gender: value === 'unknown' ? null : value as 'male' | 'female' 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kjønn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Ukjent</SelectItem>
                        <SelectItem value="male">♂ Hann</SelectItem>
                        <SelectItem value="female">♀ Hunn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Farge</Label>
                    <Input
                      value={kitten.color}
                      onChange={(e) => updateKitten(kitten.id, { color: e.target.value })}
                      placeholder="F.eks. Seal point"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>EMS-kode</Label>
                    <Input
                      value={kitten.emsCode}
                      onChange={(e) => updateKitten(kitten.id, { emsCode: e.target.value })}
                      placeholder="F.eks. SBI n 33"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={kitten.status}
                      onValueChange={(value) => updateKitten(kitten.id, { 
                        status: value as KittenData['status'] 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Tilgjengelig</SelectItem>
                        <SelectItem value="reserved">Reservert</SelectItem>
                        <SelectItem value="sold">Solgt</SelectItem>
                        <SelectItem value="keeping">Beholder selv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Interessert / Reservert av</Label>
                    <Input
                      value={kitten.reservedBy}
                      onChange={(e) => updateKitten(kitten.id, { reservedBy: e.target.value })}
                      placeholder="Navn på kjøper/interessent"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label>Notater</Label>
                  <Textarea
                    value={kitten.notes}
                    onChange={(e) => updateKitten(kitten.id, { notes: e.target.value })}
                    rows={2}
                    placeholder="Ekstra info om kattungen..."
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
