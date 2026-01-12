import { useState } from 'react';
import { Plus, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { useUpdateLitterNew } from '@/hooks/useLittersNew';
import { toast } from 'sonner';
import { Litter } from '@/types/litter';

interface BirthNotesEditorProps {
  litter: Litter;
}

export function BirthNotesEditor({ litter }: BirthNotesEditorProps) {
  const [open, setOpen] = useState(false);
  const [birthNotes, setBirthNotes] = useState(litter.birthNotes || '');
  const updateLitter = useUpdateLitterNew();

  const handleSave = () => {
    updateLitter.mutate(
      { id: litter.id, birthNotes },
      {
        onSuccess: () => {
          toast.success('Fødselsnotater lagret');
          setOpen(false);
        },
        onError: () => toast.error('Kunne ikke lagre'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          {litter.birthNotes ? 'Rediger fødselsnotater' : 'Legg til fødselsnotater'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fødselsnotater</DialogTitle>
          <DialogDescription>
            Dokumenter fødselen: tegn på forestående fødsel, forløp, eventuelle komplikasjoner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fødselsforløp</Label>
            <Textarea
              value={birthNotes}
              onChange={(e) => setBirthNotes(e.target.value)}
              placeholder="Beskriv fødselen: tegn på fødsel, tidspunkt, forløp, eventuelle komplikasjoner..."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={updateLitter.isPending}>
            {updateLitter.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
