import { useState, useRef, useCallback } from 'react';
import { Upload, Clipboard, Heart, Loader2, Sparkles, Info } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calculateCOI, getCOIRiskLevel, PedigreeData, CommonAncestor } from '@/lib/coiCalculator';

export default function TestMating() {
  const { cats } = useData();
  const [damId, setDamId] = useState<string>('');
  const [sireId, setSireId] = useState<string>('');
  const [externalSirePedigree, setExternalSirePedigree] = useState<string>('');
  const [externalSireName, setExternalSireName] = useState<string>('');
  const [externalDamPedigree, setExternalDamPedigree] = useState<string>('');
  const [externalDamName, setExternalDamName] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isParsingDam, setIsParsingDam] = useState(false);
  const [isParsingSire, setIsParsingSire] = useState(false);
  
  // Full pedigree data for COI calculation
  const [sirePedigreeData, setSirePedigreeData] = useState<PedigreeData | null>(null);
  const [damPedigreeData, setDamPedigreeData] = useState<PedigreeData | null>(null);
  const [coiResult, setCoiResult] = useState<{ coi: number; commonAncestors: CommonAncestor[] } | null>(null);
  
  const damPedigreeInputRef = useRef<HTMLInputElement>(null);
  const sirePedigreeInputRef = useRef<HTMLInputElement>(null);

  const females = cats.filter(c => c.gender === 'female');
  const males = cats.filter(c => c.gender === 'male');
  
  const selectedDam = females.find(c => c.id === damId);
  const selectedSire = males.find(c => c.id === sireId);

  const parsePedigreeImage = useCallback(async (
    imageData: string, 
    isUrl: boolean,
    setName: (name: string) => void,
    setPedigreeData: (data: PedigreeData) => void,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    toast.info('Analyserer stamtavle...');
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-pedigree', {
        body: isUrl ? { imageUrl: imageData } : { imageData },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Kunne ikke analysere stamtavle');
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Kunne ikke analysere stamtavle');
        return;
      }

      const pedigreeData = data.data as PedigreeData;
      console.log('Pedigree data received:', pedigreeData);

      // Store the full pedigree data
      setPedigreeData(pedigreeData);

      if (pedigreeData.name) {
        setName(pedigreeData.name);
        
        // Count ancestors found
        const ancestorCount = [
          pedigreeData.sire, pedigreeData.dam,
          pedigreeData.sire_sire, pedigreeData.sire_dam, pedigreeData.dam_sire, pedigreeData.dam_dam,
          pedigreeData.sire_sire_sire, pedigreeData.sire_sire_dam, pedigreeData.sire_dam_sire, pedigreeData.sire_dam_dam,
          pedigreeData.dam_sire_sire, pedigreeData.dam_sire_dam, pedigreeData.dam_dam_sire, pedigreeData.dam_dam_dam
        ].filter(a => a?.name).length;
        
        toast.success(`Fant ${pedigreeData.name} med ${ancestorCount} forfedre`);
      } else {
        toast.info('Kunne ikke finne navn fra stamtavlen');
      }
    } catch (err) {
      console.error('Error parsing pedigree:', err);
      toast.error('Feil ved analyse av stamtavle');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileUpload = useCallback((
    file: File, 
    setPedigree: (url: string) => void,
    setName: (name: string) => void,
    setPedigreeData: (data: PedigreeData) => void,
    setLoading: (loading: boolean) => void,
    clearCatId: () => void
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      clearCatId();
      setPedigree(dataUrl);
      toast.success('Stamtavle lastet opp');
      await parsePedigreeImage(dataUrl, false, setName, setPedigreeData, setLoading);
    };
    reader.readAsDataURL(file);
  }, [parsePedigreeImage]);

  const handlePaste = useCallback(async (
    setPedigree: (url: string) => void,
    setName: (name: string) => void,
    setPedigreeData: (data: PedigreeData) => void,
    setLoading: (loading: boolean) => void,
    clearCatId: () => void
  ) => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            clearCatId();
            setPedigree(dataUrl);
            toast.success('Stamtavle limt inn');
            await parsePedigreeImage(dataUrl, false, setName, setPedigreeData, setLoading);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      toast.error('Ingen bilde funnet i utklippstavlen');
    } catch {
      toast.error('Kunne ikke lese utklippstavlen');
    }
  }, [parsePedigreeImage]);

  const handleUrlBlur = useCallback(async (
    url: string,
    setName: (name: string) => void,
    setPedigreeData: (data: PedigreeData) => void,
    setLoading: (loading: boolean) => void
  ) => {
    if (url && url.startsWith('http')) {
      await parsePedigreeImage(url, true, setName, setPedigreeData, setLoading);
    }
  }, [parsePedigreeImage]);

  const handleTestMating = () => {
    if (!damId && !externalDamPedigree) {
      toast.error('Velg en hunn eller last opp stamtavle');
      return;
    }
    if (!sireId && !externalSirePedigree) {
      toast.error('Velg en hann eller last opp stamtavle');
      return;
    }
    
    // Calculate COI if we have pedigree data
    if (sirePedigreeData && damPedigreeData) {
      const result = calculateCOI(sirePedigreeData, damPedigreeData);
      setCoiResult(result);
      console.log('COI calculation result:', result);
    } else {
      // No pedigree data available
      setCoiResult(null);
    }
    
    setShowResult(true);
  };

  const getDamName = () => selectedDam?.name || externalDamName || 'Ekstern hunn';
  const getSireName = () => selectedSire?.name || externalSireName || 'Ekstern hann';
  const getDamPedigreeImage = () => selectedDam?.pedigreeImage || externalDamPedigree;
  const getSirePedigreeImage = () => selectedSire?.pedigreeImage || externalSirePedigree;

  const riskLevel = coiResult ? getCOIRiskLevel(coiResult.coi) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Testparring</h1>
        <p className="text-muted-foreground">
          Beregn innavelskoeffisient (COI) basert på Wright's formel
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Hunn (Dam) valg */}
        <div className="stat-card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-pink-500">♀</span> Hunn (Mor)
          </h2>
          
          <div className="space-y-2">
            <Label>Velg fra dine katter</Label>
            <Select value={damId} onValueChange={(v) => { 
              setDamId(v); 
              setExternalDamPedigree(''); 
              setExternalDamName(''); 
              setDamPedigreeData(null);
              setShowResult(false);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Velg hunn..." />
              </SelectTrigger>
              <SelectContent>
                {females.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.emsCode || cat.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDam && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedDam.breed} • {selectedDam.emsCode || selectedDam.color}
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

          <div className="pt-4 border-t">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Eller last opp/lim inn stamtavle
            </Label>
            <div className="flex gap-2 mt-2">
              <Input 
                value={externalDamPedigree.startsWith('data:') ? 'Bilde lastet opp' : externalDamPedigree}
                onChange={(e) => { setDamId(''); setExternalDamPedigree(e.target.value); setShowResult(false); }}
                onBlur={(e) => handleUrlBlur(e.target.value, setExternalDamName, setDamPedigreeData, setIsParsingDam)}
                placeholder="Stamtavle-URL..."
                className="flex-1"
                disabled={!!damId || isParsingDam}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={damPedigreeInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, setExternalDamPedigree, setExternalDamName, setDamPedigreeData, setIsParsingDam, () => { setDamId(''); setShowResult(false); });
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => damPedigreeInputRef.current?.click()}
                title="Last opp stamtavle"
                disabled={isParsingDam}
              >
                {isParsingDam ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => handlePaste(setExternalDamPedigree, setExternalDamName, setDamPedigreeData, setIsParsingDam, () => { setDamId(''); setShowResult(false); })}
                title="Lim inn fra utklippstavle"
                disabled={isParsingDam}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            {externalDamPedigree && externalDamPedigree.startsWith('data:') && (
              <div className="mt-2">
                {externalDamName && (
                  <p className="text-sm font-medium mb-1">{externalDamName}</p>
                )}
                <img 
                  src={externalDamPedigree} 
                  alt="Ekstern stamtavle" 
                  className="max-h-40 object-contain rounded border"
                />
                {damPedigreeData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {[damPedigreeData.sire, damPedigreeData.dam, damPedigreeData.sire_sire, damPedigreeData.sire_dam, 
                      damPedigreeData.dam_sire, damPedigreeData.dam_dam].filter(a => a?.name).length} forfedre funnet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hann (Sire) valg */}
        <div className="stat-card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-blue-500">♂</span> Hann (Far)
          </h2>
          
          <div className="space-y-2">
            <Label>Velg fra dine katter</Label>
            <Select value={sireId} onValueChange={(v) => { 
              setSireId(v); 
              setExternalSirePedigree(''); 
              setExternalSireName(''); 
              setSirePedigreeData(null);
              setShowResult(false);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Velg hann..." />
              </SelectTrigger>
              <SelectContent>
                {males.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.emsCode || cat.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSire && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedSire.breed} • {selectedSire.emsCode || selectedSire.color}
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
            <Label className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Eller last opp/lim inn stamtavle
            </Label>
            <div className="flex gap-2 mt-2">
              <Input 
                value={externalSirePedigree.startsWith('data:') ? 'Bilde lastet opp' : externalSirePedigree}
                onChange={(e) => { setSireId(''); setExternalSirePedigree(e.target.value); setShowResult(false); }}
                onBlur={(e) => handleUrlBlur(e.target.value, setExternalSireName, setSirePedigreeData, setIsParsingSire)}
                placeholder="Stamtavle-URL..."
                className="flex-1"
                disabled={!!sireId || isParsingSire}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={sirePedigreeInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, setExternalSirePedigree, setExternalSireName, setSirePedigreeData, setIsParsingSire, () => { setSireId(''); setShowResult(false); });
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => sirePedigreeInputRef.current?.click()}
                title="Last opp stamtavle"
                disabled={isParsingSire}
              >
                {isParsingSire ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => handlePaste(setExternalSirePedigree, setExternalSireName, setSirePedigreeData, setIsParsingSire, () => { setSireId(''); setShowResult(false); })}
                title="Lim inn fra utklippstavle"
                disabled={isParsingSire}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            {externalSirePedigree && externalSirePedigree.startsWith('data:') && (
              <div className="mt-2">
                {externalSireName && (
                  <p className="text-sm font-medium mb-1">{externalSireName}</p>
                )}
                <img 
                  src={externalSirePedigree} 
                  alt="Ekstern stamtavle" 
                  className="max-h-40 object-contain rounded border"
                />
                {sirePedigreeData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {[sirePedigreeData.sire, sirePedigreeData.dam, sirePedigreeData.sire_sire, sirePedigreeData.sire_dam,
                      sirePedigreeData.dam_sire, sirePedigreeData.dam_dam].filter(a => a?.name).length} forfedre funnet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleTestMating} 
          size="lg" 
          className="gap-2"
          disabled={isParsingDam || isParsingSire}
        >
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
                  <p className="text-sm">{getDamName()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-500">Far</p>
                  <p className="text-sm">{getSireName()}</p>
                </div>
              </div>
            </div>

            {/* Innavelskoeffisient */}
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                Innavelskoeffisient (COI)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Beregnet med Wright's formel basert på felles forfedre i stamtavlene.</p>
                      <p className="mt-1 text-xs">F = Σ (1/2)^(n1+n2+1)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="p-4 bg-muted rounded-lg">
                {coiResult ? (
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${riskLevel?.color}`}>
                      {coiResult.coi.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {riskLevel?.description}
                    </p>
                    {coiResult.commonAncestors.length > 0 && (
                      <div className="mt-3 text-left">
                        <p className="text-xs font-medium mb-1">Felles forfedre:</p>
                        <ul className="text-xs text-muted-foreground">
                          {coiResult.commonAncestors.map((ancestor, idx) => (
                            <li key={idx}>
                              • {ancestor.name} ({(ancestor.contribution * 100).toFixed(2)}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Last opp stamtavler for begge katter for å beregne COI
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                * COI beregnes basert på tilgjengelig stamtavledata. For nøyaktig beregning anbefales 5+ generasjoner.
              </p>
            </div>
          </div>

          {/* Stamtavlebilder side ved side */}
          {(getDamPedigreeImage() || getSirePedigreeImage()) && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium">Stamtavler</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {getDamPedigreeImage() && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{getDamName()}</p>
                    <img 
                      src={getDamPedigreeImage()} 
                      alt="Mor stamtavle"
                      className="w-full object-contain rounded border"
                    />
                  </div>
                )}
                {getSirePedigreeImage() && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{getSireName()}</p>
                    <img 
                      src={getSirePedigreeImage()} 
                      alt="Far stamtavle"
                      className="w-full object-contain rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COI Reference Table */}
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">COI-referanse</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">Mor-sønn / Far-datter</p>
                <p className="text-muted-foreground">25%</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">Helsøsken</p>
                <p className="text-muted-foreground">25%</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">Halvsøsken</p>
                <p className="text-muted-foreground">12.5%</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="font-medium">Besteforeldre-barnebarn</p>
                <p className="text-muted-foreground">12.5%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
