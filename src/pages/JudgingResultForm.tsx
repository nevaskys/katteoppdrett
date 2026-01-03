import { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Star, X } from 'lucide-react';
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
import { useCats } from '@/hooks/useCats';
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

const formSchema = z.object({
  catId: z.string().min(1, 'Velg en katt'),
  judgeId: z.string().optional(),
  showId: z.string().optional(),
  date: z.string().min(1, 'Dato er påkrevd'),
  ocrText: z.string().optional(),
  myRating: z.number().min(0).max(5).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function JudgingResultForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedCatId = searchParams.get('catId');
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: existingResult, isLoading: resultLoading } = useJudgingResult(id);
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: judges = [], isLoading: judgesLoading } = useJudges();
  const { data: shows = [], isLoading: showsLoading } = useShows();

  const addJudgingResult = useAddJudgingResult();
  const updateJudgingResult = useUpdateJudgingResult();
  const addJudge = useAddJudge();
  const addShow = useAddShow();

  const [images, setImages] = useState<string[]>([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeCountry, setNewJudgeCountry] = useState('');
  const [newShowName, setNewShowName] = useState('');
  const [newShowLocation, setNewShowLocation] = useState('');
  const [newShowDate, setNewShowDate] = useState('');
  const [judgeDialogOpen, setJudgeDialogOpen] = useState(false);
  const [showDialogOpen, setShowDialogOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      catId: preselectedCatId || '',
      judgeId: '',
      showId: '',
      date: new Date().toISOString().split('T')[0],
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
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

        {/* Image upload */}
        <div className="space-y-2">
          <Label>Bilder av dommerseddel</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
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
                </div>
              ))}
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
