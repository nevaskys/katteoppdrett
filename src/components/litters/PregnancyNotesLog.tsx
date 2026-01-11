import { useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PregnancyNoteEntry } from '@/types/litter';

interface PregnancyNotesLogProps {
  entries: PregnancyNoteEntry[];
  onChange: (entries: PregnancyNoteEntry[]) => void;
}

export function PregnancyNotesLog({ entries, onChange }: PregnancyNotesLogProps) {
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newNote, setNewNote] = useState('');

  const handleAdd = () => {
    if (!newNote.trim()) return;
    
    const newEntry: PregnancyNoteEntry = {
      id: crypto.randomUUID(),
      date: newDate,
      note: newNote.trim(),
    };
    
    // Sort by date descending (newest first)
    const updated = [...entries, newEntry].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    onChange(updated);
    setNewNote('');
    setNewDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleRemove = (id: string) => {
    onChange(entries.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Drektighetslogg</h4>
      </div>
      
      {/* Add new entry form */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pregnancy-note-date" className="text-xs">Dato</Label>
            <Input
              id="pregnancy-note-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <Label htmlFor="pregnancy-note-text" className="text-xs">Notat</Label>
            <div className="flex gap-2">
              <Textarea
                id="pregnancy-note-text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Uke-observasjoner, oppførsel, matlyst, mageomfang..."
                className="min-h-[60px] flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={!newNote.trim()}
                className="self-end"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-start gap-3 bg-card border rounded-lg p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary">
                    {format(new Date(entry.date), 'd. MMM yyyy', { locale: nb })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.note}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(entry.id)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Ingen loggførte notater ennå
        </p>
      )}
    </div>
  );
}
