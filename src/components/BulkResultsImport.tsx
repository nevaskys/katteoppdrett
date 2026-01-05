import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, Check, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAddJudgingResult, useAddJudge, useAddShow, useJudges, useShows } from '@/hooks/useJudgingResults';

interface ParsedResult {
  showName: string;
  date: string;
  emsCode?: string;
  class?: string;
  result?: string;
  points?: number;
  judgeName?: string;
}

interface BulkResultsImportProps {
  catId: string;
  catName: string;
}

export function BulkResultsImport({ catId, catName }: BulkResultsImportProps) {
  const [open, setOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResults, setParsedResults] = useState<ParsedResult[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const { data: judges = [] } = useJudges();
  const { data: shows = [] } = useShows();
  const addJudgingResult = useAddJudgingResult();
  const addJudge = useAddJudge();
  const addShow = useAddShow();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    const imageData = await new Promise<string>((resolve) => {
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setPreviewImage(imageData);
    await analyzeImage(imageData);
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setParsedResults([]);
    setSelectedIndices(new Set());
    
    try {
      const response = await supabase.functions.invoke('parse-results-list', {
        body: { imageData }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Kunne ikke analysere bildet');
      }
      
      const results: ParsedResult[] = response.data.data.results || [];
      setParsedResults(results);
      
      // Select all by default
      setSelectedIndices(new Set(results.map((_, i) => i)));
      
      toast.success(`Fant ${results.length} resultater`);
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error(error instanceof Error ? error.message : 'Kunne ikke analysere bildet');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(parsedResults.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const findOrCreateJudge = async (judgeName: string): Promise<string | undefined> => {
    if (!judgeName) return undefined;
    
    const existing = judges.find(j => 
      j.name.toLowerCase() === judgeName.toLowerCase() ||
      j.name.toLowerCase().includes(judgeName.toLowerCase()) ||
      judgeName.toLowerCase().includes(j.name.toLowerCase())
    );
    
    if (existing) return existing.id;
    
    try {
      const newJudge = await addJudge.mutateAsync({ name: judgeName });
      return newJudge.id;
    } catch {
      console.error('Could not create judge:', judgeName);
      return undefined;
    }
  };

  const findOrCreateShow = async (showName: string, date?: string): Promise<string | undefined> => {
    if (!showName) return undefined;
    
    const existing = shows.find(s => 
      s.name.toLowerCase() === showName.toLowerCase()
    );
    
    if (existing) return existing.id;
    
    try {
      const newShow = await addShow.mutateAsync({ name: showName, date });
      return newShow.id;
    } catch {
      console.error('Could not create show:', showName);
      return undefined;
    }
  };

  const handleImport = async () => {
    const toImport = parsedResults.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) {
      toast.warning('Velg minst ett resultat å importere');
      return;
    }
    
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const result of toImport) {
      try {
        const judgeId = result.judgeName ? await findOrCreateJudge(result.judgeName) : undefined;
        const showId = result.showName ? await findOrCreateShow(result.showName, result.date) : undefined;
        
        // Build structured result
        const structuredResult: Record<string, string | number | undefined> = {};
        if (result.class) structuredResult.class = result.class;
        if (result.emsCode) structuredResult.emsCode = result.emsCode;
        if (result.points) structuredResult.points = result.points;
        
        await addJudgingResult.mutateAsync({
          catId,
          judgeId,
          showId,
          date: result.date || new Date().toISOString().split('T')[0],
          result: result.result,
          structuredResult: Object.keys(structuredResult).length > 0 ? structuredResult : undefined,
          notes: result.points ? `Poeng: ${result.points}` : undefined,
        });
        
        successCount++;
      } catch (error) {
        console.error('Error importing result:', error);
        errorCount++;
      }
    }
    
    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`Importerte ${successCount} resultater`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} resultater feilet`);
    }
    
    if (successCount > 0 && errorCount === 0) {
      setOpen(false);
      setParsedResults([]);
      setPreviewImage(null);
    }
  };

  const reset = () => {
    setParsedResults([]);
    setPreviewImage(null);
    setSelectedIndices(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Importer liste
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer resultatliste for {catName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!previewImage ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Last opp et bilde av resultatlisten (f.eks. fra PawPeds eller klubbsider)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => cameraRef.current?.click()}>
                      <Camera className="h-4 w-4 mr-2" />
                      Ta bilde
                    </Button>
                    <Button variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Velg fil
                    </Button>
                  </div>
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Resultatliste" 
                  className="w-full max-h-48 object-contain rounded-md border"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2"
                  onClick={reset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {isAnalyzing && (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyserer bilde...</span>
                </div>
              )}
              
              {parsedResults.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedIndices.size} av {parsedResults.length} valgt
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll}>
                        Velg alle
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAll}>
                        Fjern alle
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left w-8"></th>
                          <th className="p-2 text-left">Dato</th>
                          <th className="p-2 text-left">Utstilling</th>
                          <th className="p-2 text-left">Klasse</th>
                          <th className="p-2 text-left">Resultat</th>
                          <th className="p-2 text-left">Dommer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedResults.map((result, index) => (
                          <tr 
                            key={index} 
                            className={`border-t hover:bg-muted/50 cursor-pointer ${
                              selectedIndices.has(index) ? 'bg-muted/30' : ''
                            }`}
                            onClick={() => toggleSelection(index)}
                          >
                            <td className="p-2">
                              <Checkbox 
                                checked={selectedIndices.has(index)}
                                onCheckedChange={() => toggleSelection(index)}
                              />
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {result.date ? new Date(result.date).toLocaleDateString('nb-NO') : '-'}
                            </td>
                            <td className="p-2 max-w-40 truncate" title={result.showName}>
                              {result.showName || '-'}
                            </td>
                            <td className="p-2 whitespace-nowrap">{result.class || '-'}</td>
                            <td className="p-2 whitespace-nowrap font-medium">{result.result || '-'}</td>
                            <td className="p-2 max-w-32 truncate" title={result.judgeName}>
                              {result.judgeName || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Avbryt
                    </Button>
                    <Button 
                      onClick={handleImport} 
                      disabled={selectedIndices.size === 0 || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importerer...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Importer {selectedIndices.size} resultater
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
