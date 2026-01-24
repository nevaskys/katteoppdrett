import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, RotateCcw, Plus, X, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PackingItem {
  id: string;
  label: string;
  category: string;
  isCustom?: boolean;
}

const defaultItems: PackingItem[] = [
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

const DEFAULT_CATEGORIES = ['Utstyr', 'Mat & Vann', 'Pleie', 'Dokumenter', 'Annet'];

const STORAGE_KEY = 'show-packing-list';
const CUSTOM_ITEMS_KEY = 'show-packing-custom-items';
const HIDDEN_ITEMS_KEY = 'show-packing-hidden-items';

export function ShowPackingList() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [customItems, setCustomItems] = useState<PackingItem[]>([]);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  
  // Add item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Annet');
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCheckedItems(parsed.checkedItems || {});
      setNotes(parsed.notes || '');
    }
    
    const savedCustom = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (savedCustom) {
      setCustomItems(JSON.parse(savedCustom));
    }
    
    const savedHidden = localStorage.getItem(HIDDEN_ITEMS_KEY);
    if (savedHidden) {
      setHiddenItems(new Set(JSON.parse(savedHidden)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checkedItems, notes }));
  }, [checkedItems, notes]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
  }, [customItems]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify([...hiddenItems]));
  }, [hiddenItems]);

  const allItems = [...defaultItems, ...customItems];
  const visibleItems = allItems.filter(item => !hiddenItems.has(item.id));
  const categories = [...new Set(visibleItems.map(item => item.category))];

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

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;
    
    const newItem: PackingItem = {
      id: `custom-${Date.now()}`,
      label: newItemLabel.trim(),
      category: newItemCategory,
      isCustom: true,
    };
    
    setCustomItems(prev => [...prev, newItem]);
    setNewItemLabel('');
    setNewItemCategory('Annet');
    setAddDialogOpen(false);
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
    setCheckedItems(prev => {
      const newChecked = { ...prev };
      delete newChecked[id];
      return newChecked;
    });
  };

  const handleToggleHidden = (id: string) => {
    setHiddenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleRestoreDefaults = () => {
    setHiddenItems(new Set());
  };

  const checkedCount = Object.entries(checkedItems).filter(([id, checked]) => 
    checked && !hiddenItems.has(id)
  ).length;

  return (
    <div className="space-y-6 print:text-black">
      <div className="flex items-center justify-between gap-2 print:hidden flex-wrap">
        <p className="text-sm text-muted-foreground">
          {checkedCount} av {visibleItems.length} pakket
        </p>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Legg til
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Legg til nytt element</DialogTitle>
                <DialogDescription>
                  Legg til et element i pakklisten
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="itemLabel">Navn</Label>
                  <Input
                    id="itemLabel"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    placeholder="F.eks. Ekstra håndkle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemCategory">Kategori</Label>
                  <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleAddItem} disabled={!newItemLabel.trim()}>
                  Legg til
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant={editMode ? "default" : "outline"} 
            size="sm" 
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {editMode ? 'Ferdig' : 'Tilpass'}
          </Button>
          
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

      {editMode && hiddenItems.size > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRestoreDefaults}
          className="text-muted-foreground"
        >
          Gjenopprett skjulte elementer ({hiddenItems.size})
        </Button>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map(category => (
          <div key={category} className="space-y-2">
            <h3 className="font-semibold text-sm text-primary">{category}</h3>
            <div className="space-y-1">
              {visibleItems
                .filter(item => item.category === category)
                .map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-2 text-sm hover:bg-muted/50 p-1 rounded group"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <Checkbox
                        checked={checkedItems[item.id] || false}
                        onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                      />
                      <span className={checkedItems[item.id] ? 'line-through text-muted-foreground' : ''}>
                        {item.label}
                      </span>
                    </label>
                    
                    {editMode && (
                      <div className="flex gap-1">
                        {item.isCustom ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveCustomItem(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleHidden(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
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
