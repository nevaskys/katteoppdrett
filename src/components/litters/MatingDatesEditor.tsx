import { useState } from 'react';
import { Calendar, Calculator, Loader2 } from 'lucide-react';
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
import { addDays, format } from 'date-fns';

const GESTATION_DAYS = 65;

interface MatingDatesEditorProps {
  litter: Litter;
}

export function MatingDatesEditor({ litter }: MatingDatesEditorProps) {
  const [open, setOpen] = useState(false);
  const [matingDateFrom, setMatingDateFrom] = useState(litter.matingDateFrom || litter.matingDate || '');
  const [matingDateTo, setMatingDateTo] = useState(litter.matingDateTo || '');
  const [expectedDate, setExpectedDate] = useState(litter.expectedDate || '');
  const updateLitter = useUpdateLitterNew();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setMatingDateFrom(litter.matingDateFrom || litter.matingDate || '');
      setMatingDateTo(litter.matingDateTo || '');
      setExpectedDate(litter.expectedDate || '');
    }
  };

  const handleCalculateExpectedDate = () => {
    if (matingDateFrom) {
      const calculated = addDays(new Date(matingDateFrom), GESTATION_DAYS);
      setExpectedDate(format(calculated, 'yyyy-MM-dd'));
      toast.success(`Forventet fødsel beregnet: ${format(calculated, 'd. MMM yyyy')}`);
    }
  };

  const handleSave = () => {
    updateLitter.mutate(
      {
        id: litter.id,
        matingDateFrom: matingDateFrom || null,
        matingDateTo: matingDateTo || null,
        matingDate: matingDateFrom || null,
        expectedDate: expectedDate || null,
      },
      {
        onSuccess: () => {
          toast.success('Parringsdatoer oppdatert');
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
          <Calendar className="h-4 w-4 mr-2" />
          Parringsdatoer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Parringsdatoer</DialogTitle>
          <DialogDescription>
            Registrer parringsperiode og forventet fødsel
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="matingDateFrom">Fra dato</Label>
            <Input
              id="matingDateFrom"
              type="date"
              value={matingDateFrom}
              onChange={(e) => setMatingDateFrom(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="matingDateTo">Til dato (valgfritt)</Label>
            <Input
              id="matingDateTo"
              type="date"
              value={matingDateTo}
              onChange={(e) => setMatingDateTo(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="expectedDate">Forventet fødsel</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCalculateExpectedDate}
                disabled={!matingDateFrom}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Beregn
              </Button>
            </div>
            <Input
              id="expectedDate"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
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
