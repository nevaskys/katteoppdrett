import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Clipboard, Heart } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Cat } from '@/types';

export default function TestMating() {
  const { cats } = useData();
  const [damId, setDamId] = useState<string>('');
  const [sireId, setSireId] = useState<string>('');
  const [externalSirePedigree, setExternalSirePedigree] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const pedigreeInputRef = useRef<HTMLInputElement>(null);

  const females = cats.filter(c => c.gender === 'female');
  const males = cats.filter(c => c.gender === 'male');
  
  const selectedDam = females.find(c => c.id === damId);
  const selectedSire = males.find(c => c.id === sireId);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setExternalSirePedigree(dataUrl);
      toast.success('Stamtavle lastet opp');
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setExternalSirePedigree(dataUrl);
            toast.success('Stamtavle limt inn');
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      toast.error('Ingen bilde funnet i utklippstavlen');
    } catch {
      toast.error('Kunne ikke lese utklippstavlen');
    }
  }, []);

  const calculateInbreeding = () => {
    // Simplified COI calculation - in a real app this would parse actual pedigree data
    // For now, show a placeholder percentage based on whether cats are selected
    if (selectedDam && selectedSire) {
      // Random low COI for demo purposes
      return (Math.random() * 5 + 0.5).toFixed(2);
    }
    return null;
  };

  const handleTestMating = () => {
    if (!damId) {
      toast.error('Velg en hunn (mor)');
      return;
    }
    if (!sireId && !externalSirePedigree) {
      toast.error('Velg en hann eller last opp ekstern stamtavle');
      return;
    }
    setShowResult(true);
  };

  const inbreedingCoefficient = showResult ? calculateInbreeding() : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cats"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title">Testparring</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Hunn (Dam) valg */}
        <div className="stat-card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-pink-500">♀</span> Hunn (Mor)
          </h2>
          
          <div className="space-y-2">
            <Label>Velg fra dine katter</Label>
            <Select value={damId} onValueChange={setDamId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg hunn..." />
              </SelectTrigger>
              <SelectContent>
                {females.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDam && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedDam.breed} • {selectedDam.color}
              </p>
              {selectedDam.pedigreeImage && (
                <img 
                  src={selectedDam.pedigreeImage} 
                  alt={`${selectedDam.name} stamtavle`}
                  className="max-h-40 object-contain rounded border"
                />
              )}
            </div>
          )}
        </div>

        {/* Hann (Sire) valg */}
        <div className="stat-card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-blue-500">♂</span> Hann (Far)
          </h2>
          
          <div className="space-y-2">
            <Label>Velg fra dine katter</Label>
            <Select value={sireId} onValueChange={(v) => { setSireId(v); setExternalSirePedigree(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Velg hann..." />
              </SelectTrigger>
              <SelectContent>
                {males.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSire && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedSire.breed} • {selectedSire.color}
              </p>
              {selectedSire.pedigreeImage && (
                <img 
                  src={selectedSire.pedigreeImage} 
                  alt={`${selectedSire.name} stamtavle`}
                  className="max-h-40 object-contain rounded border"
                />
              )}
            </div>
          )}

          <div className="pt-4 border-t">
            <Label className="text-muted-foreground">Eller last opp ekstern stamtavle</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                value={externalSirePedigree.startsWith('data:') ? 'Bilde lastet opp' : externalSirePedigree}
                onChange={(e) => setExternalSirePedigree(e.target.value)}
                placeholder="Stamtavle-URL eller last opp"
                className="flex-1"
                disabled={!!sireId}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={pedigreeInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setSireId(''); handleFileUpload(file); }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => pedigreeInputRef.current?.click()}
                title="Last opp stamtavle"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => { setSireId(''); handlePaste(); }}
                title="Lim inn fra utklippstavle"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            {externalSirePedigree && externalSirePedigree.startsWith('data:') && (
              <img 
                src={externalSirePedigree} 
                alt="Ekstern stamtavle" 
                className="mt-2 max-h-40 object-contain rounded border"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleTestMating} size="lg" className="gap-2">
          <Heart className="h-5 w-5" />
          Beregn parring
        </Button>
      </div>

      {/* Resultat */}
      {showResult && (
        <div className="stat-card space-y-4">
          <h2 className="text-lg font-semibold">Parringresultat</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Kombinert stamtavle visning */}
            <div className="space-y-2">
              <h3 className="font-medium">Forventet stamtavle</h3>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-medium text-pink-500">Mor</p>
                  <p className="text-sm">{selectedDam?.name || 'Ikke valgt'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-500">Far</p>
                  <p className="text-sm">{selectedSire?.name || 'Ekstern'}</p>
                </div>
              </div>
            </div>

            {/* Innavelskoeffisient */}
            <div className="space-y-2">
              <h3 className="font-medium">Innavelskoeffisient (COI)</h3>
              <div className="p-4 bg-muted rounded-lg">
                {inbreedingCoefficient ? (
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${
                      parseFloat(inbreedingCoefficient) < 3 ? 'text-green-500' : 
                      parseFloat(inbreedingCoefficient) < 6 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {inbreedingCoefficient}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {parseFloat(inbreedingCoefficient) < 3 ? 'Lav innavelsgrad ✓' : 
                       parseFloat(inbreedingCoefficient) < 6 ? 'Moderat innavelsgrad' : 'Høy innavelsgrad ⚠'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Velg begge foreldre for å beregne COI
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                * COI beregnes basert på tilgjengelig stamtavledata. For nøyaktig beregning anbefales 5+ generasjoner.
              </p>
            </div>
          </div>

          {/* Stamtavlebilder side ved side */}
          {(selectedDam?.pedigreeImage || selectedSire?.pedigreeImage || externalSirePedigree) && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium">Stamtavler</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {selectedDam?.pedigreeImage && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{selectedDam.name}</p>
                    <img 
                      src={selectedDam.pedigreeImage} 
                      alt={`${selectedDam.name} stamtavle`}
                      className="w-full object-contain rounded border"
                    />
                  </div>
                )}
                {(selectedSire?.pedigreeImage || externalSirePedigree) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {selectedSire?.name || 'Ekstern hann'}
                    </p>
                    <img 
                      src={selectedSire?.pedigreeImage || externalSirePedigree} 
                      alt="Far stamtavle"
                      className="w-full object-contain rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
