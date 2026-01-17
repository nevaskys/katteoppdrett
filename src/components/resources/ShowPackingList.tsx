import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Printer, RotateCcw } from 'lucide-react';

const defaultItems = [
  { id: 'cage', label: 'Utstillingsbur (godkjent størrelse)', category: 'Utstyr' },
  { id: 'cage-cover', label: 'Burtrekk/gardiner', category: 'Utstyr' },
  { id: 'litter-box', label: 'Reisekattedo', category: 'Utstyr' },
  { id: 'litter', label: 'Kattesand', category: 'Utstyr' },
  { id: 'water-bowl', label: 'Vannskål', category: 'Utstyr' },
  { id: 'food-bowl', label: 'Matskål', category: 'Utstyr' },
  { id: 'blanket', label: 'Teppe/pute til buret', category: 'Utstyr' },
  { id: 'carrier', label: 'Transportbur', category: 'Utstyr' },
  
  { id: 'food', label: 'Kattemat (våt og tørr)', category: 'Mat & Vann' },
  { id: 'treats', label: 'Godbiter', category: 'Mat & Vann' },
  { id: 'water', label: 'Vann fra hjemme', category: 'Mat & Vann' },
  
  { id: 'brush', label: 'Børste', category: 'Pleie' },
  { id: 'comb', label: 'Kam (fin og grov)', category: 'Pleie' },
  { id: 'nail-clipper', label: 'Klosaks', category: 'Pleie' },
  { id: 'eye-cleaner', label: 'Øyerens', category: 'Pleie' },
  { id: 'ear-cleaner', label: 'Ørerens', category: 'Pleie' },
  { id: 'coat-spray', label: 'Pelsspray', category: 'Pleie' },
  { id: 'powder', label: 'Pudder (hvis tillatt)', category: 'Pleie' },
  
  { id: 'vaccination-card', label: 'Vaksinasjonskort', category: 'Dokumenter' },
  { id: 'registration', label: 'Registreringsbevis', category: 'Dokumenter' },
  { id: 'pedigree', label: 'Stamtavle (kopi)', category: 'Dokumenter' },
  { id: 'entry-confirmation', label: 'Påmeldingsbekreftelse', category: 'Dokumenter' },
  
  { id: 'disinfectant', label: 'Desinfeksjon/håndsprit', category: 'Annet' },
  { id: 'paper-towels', label: 'Tørkepapir', category: 'Annet' },
  { id: 'garbage-bags', label: 'Søppelposer', category: 'Annet' },
  { id: 'toys', label: 'Leker', category: 'Annet' },
  { id: 'decoration', label: 'Burpynt', category: 'Annet' },
];

const STORAGE_KEY = 'show-packing-list';

export function ShowPackingList() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCheckedItems(parsed.checkedItems || {});
      setNotes(parsed.notes || '');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checkedItems, notes }));
  }, [checkedItems, notes]);

  const handleCheck = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }));
  };

  const handleReset = () => {
    setCheckedItems({});
    setNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = [...new Set(defaultItems.map(item => item.category))];
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="space-y-6 print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          {checkedCount} av {defaultItems.length} pakket
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Nullstill
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Skriv ut
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map(category => (
          <div key={category} className="space-y-2">
            <h3 className="font-semibold text-sm text-primary">{category}</h3>
            <div className="space-y-1">
              {defaultItems
                .filter(item => item.category === category)
                .map(item => (
                  <label 
                    key={item.id} 
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={checkedItems[item.id] || false}
                      onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                    />
                    <span className={checkedItems[item.id] ? 'line-through text-muted-foreground' : ''}>
                      {item.label}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-primary">Egne notater</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Skriv egne notater her... (f.eks. spesielle ting å huske, hotellinfo, etc.)"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
