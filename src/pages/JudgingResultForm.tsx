import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Star, X, Camera, Upload, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCats, useAddCat } from '@/hooks/useCats';
import {
  useJudges,
  useShows,
  useAddJudge,
  useAddShow,
  useAddJudgingResult,
  useUpdateJudgingResult,
  useJudgingResult,
} from '@/hooks/useJudgingResults';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  catId: z.string().min(1, 'Velg en katt'),
  judgeId: z.string().optional(),
  showId: z.string().optional(),
  date: z.string().min(1, 'Dato er påkrevd'),
  result: z.string().optional(),
  ocrText: z.string().optional(),
  myRating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface JudgingSheetData {
  catName?: string;
  judgeName?: string;
  showName?: string;
  date?: string;
  result?: string;
  ocrText?: string;
  structuredResult?: {
    points?: number;
    title?: string;
    placement?: string;
    category?: string;
    class?: string;
    certificates?: string[];
    comments?: string;
    head?: string;
    ears?: string;
    eyes?: string;
    profile?: string;
    chin?: string;
    muzzle?: string;
    body?: string;
    legs?: string;
    tail?: string;
    coat?: string;
    texture?: string;
    color?: string;
    pattern?: string;
    condition?: string;
    general?: string;
  };
}

export default function JudgingResultForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedCatId = searchParams.get('catId');
  const navigate = useNavigate();
  const isEditing = !!id;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingResult, isLoading: resultLoading } = useJudgingResult(id);
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: judges = [], isLoading: judgesLoading } = useJudges();
  const { data: shows = [], isLoading: showsLoading } = useShows();

  const addJudgingResult = useAddJudgingResult();
  const updateJudgingResult = useUpdateJudgingResult();
  const addJudge = useAddJudge();
  const addShow = useAddShow();
  const addCat = useAddCat();

  const [images, setImages] = useState<string[]>([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeCountry, setNewJudgeCountry] = useState('');
  const [newShowName, setNewShowName] = useState('');
  const [newShowLocation, setNewShowLocation] = useState('');
  const [newShowDate, setNewShowDate] = useState('');
  const [judgeDialogOpen, setJudgeDialogOpen] = useState(false);
  const [showDialogOpen, setShowDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [structuredResult, setStructuredResult] = useState<JudgingSheetData['structuredResult'] | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catId: preselectedCatId || '',
      judgeId: '',
      showId: '',
      date: new Date().toISOString().split('T')[0],
      result: '',
      ocrText: '',
      myRating: undefined,
      notes: '',
    },
  });

  // Update form when existing result loads
  useState(() => {
    if (existingResult) {
      form.reset({
        catId: existingResult.catId,
        judgeId: existingResult.judgeId || '',
        showId: existingResult.showId || '',
        date: existingResult.date,
        result: existingResult.result || '',
        ocrText: existingResult.ocrText || '',
        myRating: existingResult.myRating,
        notes: existingResult.notes || '',
      });
      setImages(existingResult.images);
    }
  });

  const isLoading = catsLoading || judgesLoading || showsLoading || (isEditing && resultLoading);

  const handleAddJudge = async () => {
    if (!newJudgeName.trim()) return;
    try {
      const judge = await addJudge.mutateAsync({
        name: newJudgeName.trim(),
        country: newJudgeCountry.trim() || undefined,
      });
      form.setValue('judgeId', judge.id);
      setNewJudgeName('');
      setNewJudgeCountry('');
      setJudgeDialogOpen(false);
      toast.success('Dommer lagt til');
    } catch {
      toast.error('Kunne ikke legge til dommer');
    }
  };

  const handleAddShow = async () => {
    if (!newShowName.trim()) return;
    try {
      const show = await addShow.mutateAsync({
        name: newShowName.trim(),
        location: newShowLocation.trim() || undefined,
        date: newShowDate || undefined,
      });
      form.setValue('showId', show.id);
      setNewShowName('');
      setNewShowLocation('');
      setNewShowDate('');
      setShowDialogOpen(false);
      toast.success('Utstilling lagt til');
    } catch {
      toast.error('Kunne ikke legge til utstilling');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, analyzeImage: boolean = false) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve) => {
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
      newImages.push(imageData);
    }
    
    setImages(prev => [...prev, ...newImages]);
    
    // Analyze the first new image if requested
    if (analyzeImage && newImages.length > 0) {
      await analyzeJudgingSheet(newImages[0]);
    }
  };

  const analyzeJudgingSheet = async (imageData: string) => {
    setIsAnalyzing(true);
    toast.info('Analyserer dommerseddel...');
    
    try {
      const response = await supabase.functions.invoke('parse-judging-sheet', {
        body: { imageData }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Kunne ikke analysere dommerseddel');
      }
      
      const data: JudgingSheetData = result.data;
      
      // Auto-fill fields based on AI analysis
      if (data.ocrText) {
        form.setValue('ocrText', data.ocrText);
      }
      
      if (data.date) {
        form.setValue('date', data.date);
      }
      
      // Try to match cat by name, or create new cat if not found
      if (data.catName && !form.getValues('catId')) {
        const matchedCat = cats.find(cat => 
          cat.name.toLowerCase().includes(data.catName!.toLowerCase()) ||
          data.catName!.toLowerCase().includes(cat.name.toLowerCase())
        );
        if (matchedCat) {
          form.setValue('catId', matchedCat.id);
          toast.success(`Katt gjenkjent: ${matchedCat.name}`);
        } else {
          // Create new cat automatically
          try {
            const newCat = await addCat.mutateAsync({
              name: data.catName,
              breed: 'Ukjent', // Default breed - user can update later
              gender: 'female' as const, // Default - user can update later
              birthDate: '',
              color: '',
              images: [],
            });
            form.setValue('catId', newCat.id);
            toast.success(`Ny katt opprettet: ${data.catName}`);
          } catch (catError) {
            console.error('Error creating cat:', catError);
            toast.warning(`Kunne ikke opprette katt "${data.catName}" automatisk`);
          }
        }
      }
      
      // Try to match judge by name, or create new judge if not found
      if (data.judgeName) {
        const matchedJudge = judges.find(judge =>
          judge.name.toLowerCase().includes(data.judgeName!.toLowerCase()) ||
          data.judgeName!.toLowerCase().includes(judge.name.toLowerCase())
        );
        if (matchedJudge) {
          form.setValue('judgeId', matchedJudge.id);
          toast.success(`Dommer gjenkjent: ${matchedJudge.name}`);
        } else {
          // Create new judge automatically
          try {
            const newJudge = await addJudge.mutateAsync({
              name: data.judgeName,
            });
            form.setValue('judgeId', newJudge.id);
            toast.success(`Ny dommer opprettet: ${data.judgeName}`);
          } catch (judgeError) {
            console.error('Error creating judge:', judgeError);
            // Fallback: offer to add the judge manually
            setNewJudgeName(data.judgeName);
            toast.warning(`Kunne ikke opprette dommer automatisk, fyll inn manuelt`);
          }
        }
      }
      
      // Try to match show by name
      if (data.showName) {
        const matchedShow = shows.find(show =>
          show.name.toLowerCase().includes(data.showName!.toLowerCase()) ||
          data.showName!.toLowerCase().includes(show.name.toLowerCase())
        );
        if (matchedShow) {
          form.setValue('showId', matchedShow.id);
          toast.success(`Utstilling gjenkjent: ${matchedShow.name}`);
        } else {
          // Offer to add the show manually (don't auto-create shows)
          setNewShowName(data.showName);
        }
      }
      
      // Store structured result and auto-fill result field
      if (data.structuredResult) {
        setStructuredResult(data.structuredResult);
        
        // Build result string from structured data
        const resultParts: string[] = [];
        if (data.structuredResult.title) resultParts.push(data.structuredResult.title);
        if (data.structuredResult.placement) resultParts.push(data.structuredResult.placement);
        if (data.structuredResult.certificates?.length) resultParts.push(data.structuredResult.certificates.join(', '));
        
        if (resultParts.length > 0 && !form.getValues('result')) {
          form.setValue('result', resultParts.join(' - '));
        }
        
        // Build structured notes with all judging field comments
        const structuredNotes: string[] = [];
        if (data.structuredResult.points) structuredNotes.push(`Poeng: ${data.structuredResult.points}`);
        
        // Add individual judging field comments
        const fieldLabels: Record<string, string> = {
          head: 'Hode',
          ears: 'Ører',
          eyes: 'Øyne',
          profile: 'Profil',
          chin: 'Hake',
          muzzle: 'Snute',
          body: 'Kropp',
          legs: 'Ben',
          tail: 'Hale',
          coat: 'Pels',
          texture: 'Tekstur',
          color: 'Farge',
          pattern: 'Mønster',
          condition: 'Kondisjon',
          general: 'Generelt',
        };
        
        for (const [key, label] of Object.entries(fieldLabels)) {
          const value = data.structuredResult[key as keyof typeof data.structuredResult];
          if (value && typeof value === 'string') {
            structuredNotes.push(`${label}: ${value}`);
          }
        }
        
        if (data.structuredResult.comments) {
          structuredNotes.push(`\nKommentar: ${data.structuredResult.comments}`);
        }
        
        if (structuredNotes.length > 0) {
          const existingNotes = form.getValues('notes') || '';
          const newNotes = structuredNotes.join('\n');
          form.setValue('notes', existingNotes ? `${existingNotes}\n\n${newNotes}` : newNotes);
        }
      }
      
      // Also check for result field directly from AI
      if (data.result && !form.getValues('result')) {
        form.setValue('result', data.result);
      }
      
      toast.success('Dommerseddel analysert!');
    } catch (error) {
      console.error('Error analyzing judging sheet:', error);
      toast.error(error instanceof Error ? error.message : 'Kunne ikke analysere dommerseddel');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        catId: data.catId,
        judgeId: data.judgeId || undefined,
        showId: data.showId || undefined,
        date: data.date,
        result: data.result || undefined,
        images,
        ocrText: data.ocrText || undefined,
        myRating: data.myRating,
        notes: data.notes || undefined,
      };

      if (isEditing && id) {
        await updateJudgingResult.mutateAsync({ ...payload, id });
        toast.success('Utstillingsresultat oppdatert');
      } else {
        await addJudgingResult.mutateAsync(payload);
        toast.success('Utstillingsresultat lagt til');
      }
      
      if (preselectedCatId) {
        navigate(`/cats/${preselectedCatId}`);
      } else {
        navigate('/judging-results');
      }
    } catch {
      toast.error('Kunne ikke lagre utstillingsresultat');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rating = form.watch('myRating');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={preselectedCatId ? `/cats/${preselectedCatId}` : '/judging-results'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="page-title">{isEditing ? 'Rediger' : 'Nytt'} utstillingsresultat</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cat selection */}
        <div className="space-y-2">
          <Label>Katt *</Label>
          <Select
            value={form.watch('catId')}
            onValueChange={(v) => form.setValue('catId', v)}
            disabled={!!preselectedCatId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg katt" />
            </SelectTrigger>
            <SelectContent>
              {cats.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.catId && (
            <p className="text-sm text-destructive">{form.formState.errors.catId.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Dato *</Label>
          <Input type="date" {...form.register('date')} />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>

        {/* Result */}
        <div className="space-y-2">
          <Label>Resultat</Label>
          <Input
            {...form.register('result')}
            placeholder="F.eks. EX 1, NOM, BIS, BIV, CAC..."
          />
          <p className="text-xs text-muted-foreground">
            Resultat fra bedømmelsen (EX 1, EX 2, NOM, BIS, BIV, CAC, CACIB, etc.)
          </p>
        </div>

        {/* Judge selection with add new */}
        <div className="space-y-2">
          <Label>Dommer</Label>
          <div className="flex gap-2">
            <Select
              value={form.watch('judgeId') || ''}
              onValueChange={(v) => form.setValue('judgeId', v === 'none' ? '' : v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Velg dommer (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen valgt</SelectItem>
                {judges.map(judge => (
                  <SelectItem key={judge.id} value={judge.id}>
                    {judge.name} {judge.country && `(${judge.country})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={judgeDialogOpen} onOpenChange={setJudgeDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Legg til ny dommer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Navn *</Label>
                    <Input
                      value={newJudgeName}
                      onChange={(e) => setNewJudgeName(e.target.value)}
                      placeholder="Dommerens navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Land</Label>
                    <Input
                      value={newJudgeCountry}
                      onChange={(e) => setNewJudgeCountry(e.target.value)}
                      placeholder="F.eks. Norge"
                    />
                  </div>
                  <Button onClick={handleAddJudge} disabled={!newJudgeName.trim()}>
                    Legg til dommer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Show selection with add new */}
        <div className="space-y-2">
          <Label>Utstilling</Label>
          <div className="flex gap-2">
            <Select
              value={form.watch('showId') || ''}
              onValueChange={(v) => form.setValue('showId', v === 'none' ? '' : v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Velg utstilling (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen valgt</SelectItem>
                {shows.map(show => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.name} {show.date && `(${new Date(show.date).toLocaleDateString('nb-NO')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={showDialogOpen} onOpenChange={setShowDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Legg til ny utstilling</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Navn *</Label>
                    <Input
                      value={newShowName}
                      onChange={(e) => setNewShowName(e.target.value)}
                      placeholder="Utstillingens navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sted</Label>
                    <Input
                      value={newShowLocation}
                      onChange={(e) => setNewShowLocation(e.target.value)}
                      placeholder="F.eks. Oslo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dato</Label>
                    <Input
                      type="date"
                      value={newShowDate}
                      onChange={(e) => setNewShowDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddShow} disabled={!newShowName.trim()}>
                    Legg til utstilling
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Image upload with camera support */}
        <div className="space-y-3">
          <Label>Bilder av dommerseddel</Label>
          
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleImageUpload(e, true)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageUpload(e, true)}
          />
          
          {/* Upload buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCameraCapture}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-none"
            >
              <Camera className="h-4 w-4 mr-2" />
              Ta bilde
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleFileSelect}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              Velg fra galleri
            </Button>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Analyserer dommerseddel med AI...</span>
              <Loader2 className="h-4 w-4 animate-spin ml-auto" />
            </div>
          )}
          
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img}
                    alt={`Dommerseddel ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {index === 0 && !isAnalyzing && images.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-1 left-1 right-1 h-7 text-xs"
                      onClick={() => analyzeJudgingSheet(img)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Analyser på nytt
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Show structured result if available */}
          {structuredResult && (
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p className="font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI-analysert resultat:
              </p>
              {structuredResult.title && <p>Tittel: {structuredResult.title}</p>}
              {structuredResult.placement && <p>Plassering: {structuredResult.placement}</p>}
              {structuredResult.points && <p>Poeng: {structuredResult.points}</p>}
              {structuredResult.certificates?.length && (
                <p>Sertifikater: {structuredResult.certificates.join(', ')}</p>
              )}
            </div>
          )}
        </div>

        {/* OCR Text */}
        <div className="space-y-2">
          <Label>Tolket tekst (maskinskrift)</Label>
          <Textarea
            {...form.register('ocrText')}
            placeholder="Tekst fra dommerseddelen..."
            rows={4}
          />
        </div>

        {/* My Rating */}
        <div className="space-y-2">
          <Label>Min vurdering av bedømmelsen</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => form.setValue('myRating', rating === star ? undefined : star)}
                className="p-1"
              >
                <Star
                  className={`h-6 w-6 ${
                    rating && rating >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notater</Label>
          <Textarea
            {...form.register('notes')}
            placeholder="Egne notater..."
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={addJudgingResult.isPending || updateJudgingResult.isPending}>
            {(addJudgingResult.isPending || updateJudgingResult.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? 'Oppdater' : 'Lagre'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={preselectedCatId ? `/cats/${preselectedCatId}` : '/judging-results'}>
              Avbryt
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
