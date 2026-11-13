import { useState } from 'react';
import { Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSetCatLoan } from '@/hooks/useCats';
import { Cat } from '@/types';

export function CatLoanControl({ cat }: { cat: Cat }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(cat.loanStatus || 'own');
  const [party, setParty] = useState(cat.loanParty || '');
  const save = useSetCatLoan();

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setStatus(cat.loanStatus || 'own'); setParty(cat.loanParty || ''); } }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Handshake className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">
            {cat.loanStatus === 'borrowed' ? 'Lånt inn' : cat.loanStatus === 'lent_out' ? 'Lånt ut' : 'Lån'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Lån av {cat.name}</DialogTitle></DialogHeader>
        <RadioGroup value={status} onValueChange={setStatus} className="space-y-2">
          <Label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer"><RadioGroupItem value="own" /> Min katt</Label>
          <Label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer"><RadioGroupItem value="borrowed" /> Lånt inn (ikke min katt)</Label>
          <Label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer"><RadioGroupItem value="lent_out" /> Min katt, lånt ut til noen</Label>
        </RadioGroup>
        {status !== 'own' && (
          <div className="space-y-1">
            <Label>{status === 'borrowed' ? 'Lånt fra (eier/oppdrett)' : 'Lånt ut til'}</Label>
            <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Navn" />
          </div>
        )}
        <DialogFooter>
          <Button
            disabled={save.isPending}
            onClick={() => save.mutate(
              { id: cat.id, loan_status: status, loan_party: status === 'own' ? null : party.trim() || null },
              { onSuccess: () => setOpen(false) }
            )}
          >Lagre</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
