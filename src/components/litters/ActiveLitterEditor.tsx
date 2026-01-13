import { useState } from 'react';
import { Calendar, Baby, Plus, Loader2 } from 'lucide-react';
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
import { useUpdateLitterNew } from '@/hooks/useLittersNew';
import { toast } from 'sonner';
import { Litter } from '@/types/litter';

interface ActiveLitterEditorProps {
  litter: Litter;
}

export function ActiveLitterEditor({ litter }: ActiveLitterEditorProps) {
  const [open, setOpen] = useState(false);
  const [birthDate, setBirthDate] = useState(litter.birthDate || '');
  const [kittenCount, setKittenCount] = useState(litter.kittenCount?.toString() || '');
  const updateLitter = useUpdateLitterNew();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setBirthDate(litter.birthDate || '');
      setKittenCount(litter.kittenCount?.toString() || '');
    }
  };

  const handleSave = () => {
    updateLitter.mutate(
      {
        id: litter.id,
        birthDate: birthDate || null,
        kittenCount: kittenCount ? parseInt(kittenCount) : null,
      },
      {
        onSuccess: () => {
          toast.success('Fødselsinformasjon oppdatert');
          setOpen(false);
        },
        onError: () => toast.error('Kunne ikke oppdatere'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Baby className="h-4 w-4 mr-2" />
          Fødselsdato & antall
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Fødselsinformasjon</DialogTitle>
          <DialogDescription>
            Registrer fødselsdato og antall kattunger
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Fødselsdato</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kittenCount">Antall kattunger</Label>
            <Input
              id="kittenCount"
              type="number"
              min="0"
              value={kittenCount}
              onChange={(e) => setKittenCount(e.target.value)}
              placeholder="0"
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
