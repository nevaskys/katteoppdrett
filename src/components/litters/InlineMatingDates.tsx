import { useState, useEffect } from 'react';
import { Calendar, Calculator, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateLitterNew } from '@/hooks/useLittersNew';
import { toast } from 'sonner';
import { Litter } from '@/types/litter';
import { addDays, format } from 'date-fns';

const GESTATION_DAYS = 65;

interface InlineMatingDatesProps {
  litter: Litter;
}

export function InlineMatingDates({ litter }: InlineMatingDatesProps) {
  const [matingDateFrom, setMatingDateFrom] = useState(litter.matingDateFrom || litter.matingDate || '');
  const [matingDateTo, setMatingDateTo] = useState(litter.matingDateTo || '');
  const [expectedDate, setExpectedDate] = useState(litter.expectedDate || '');
  const [hasChanges, setHasChanges] = useState(false);
  const updateLitter = useUpdateLitterNew();

  // Track if user has made changes
  useEffect(() => {
    const originalFrom = litter.matingDateFrom || litter.matingDate || '';
    const originalTo = litter.matingDateTo || '';
    const originalExpected = litter.expectedDate || '';
    
    setHasChanges(
      matingDateFrom !== originalFrom ||
      matingDateTo !== originalTo ||
      expectedDate !== originalExpected
    );
  }, [matingDateFrom, matingDateTo, expectedDate, litter]);

  const handleCalculateExpectedDate = () => {
    if (matingDateFrom) {
      const calculated = addDays(new Date(matingDateFrom), GESTATION_DAYS);
      setExpectedDate(format(calculated, 'yyyy-MM-dd'));
    }
  };

  const handleSave = () => {
    updateLitter.mutate(
      {
        id: litter.id,
        matingDateFrom: matingDateFrom || null,
        matingDateTo: matingDateTo || null,
        expectedDate: expectedDate || null,
        matingDate: matingDateFrom || null, // Keep legacy field in sync
      },
      {
        onSuccess: () => {
          toast.success('Parringsdatoer lagret');
          setHasChanges(false);
        },
        onError: () => toast.error('Kunne ikke lagre'),
      }
    );
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Parringsdatoer</h2>
      </div>
      
      <div className="grid sm:grid-cols-3 gap-4">
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
              className="h-6 text-xs"
            >
              <Calculator className="h-3 w-3 mr-1" />
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
      
      {hasChanges && (
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={updateLitter.isPending}>
            {updateLitter.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lagre datoer
          </Button>
        </div>
      )}
    </div>
  );
}
