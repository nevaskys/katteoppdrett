import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, Clipboard, Loader2, Sparkles, Plus, X, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HealthTest, PreviousLitter } from '@/types';

const DEFAULT_HEALTH_TESTS = [
  { id: 'helseattest', name: 'Helseattest', completed: false },
  { id: 'hcm', name: 'HCM Screening', completed: false },
  { id: 'pkd', name: 'PKD Screening', completed: false },
];

const catSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  breed: z.string().min(1, 'Rase er påkrevd'),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().min(1, 'Fødselsdato er påkrevd'),
  chipNumber: z.string().optional(),
  registration: z.string().optional(),
  color: z.string().min(1, 'Farge er påkrevd'),
  emsCode: z.string().optional(),
  healthNotes: z.string().optional(),
  imageUrl: z.string().optional(),
  pedigreeImageUrl: z.string().optional(),
});

type CatFormData = z.infer<typeof catSchema>;

export default function CatForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, addCat, updateCat } = useData();
  const pedigreeInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isParsingPedigree, setIsParsingPedigree] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [pedigreeOpen, setPedigreeOpen] = useState(true);
  const [testMatingOpen, setTestMatingOpen] = useState(false);
  const [selectedMateId, setSelectedMateId] = useState<string>('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingPedigree, setIsDraggingPedigree] = useState(false);
  
  const existingCat = id ? cats.find(c => c.id === id) : null;
  const isEditing = !!existingCat;

  // Initialize health tests from existing cat or defaults
  const [healthTests, setHealthTests] = useState<HealthTest[]>(() => {
    if (existingCat?.healthTests && existingCat.healthTests.length > 0) {
      return existingCat.healthTests;
    }
    return DEFAULT_HEALTH_TESTS.map(t => ({ ...t }));
  });

  // Initialize previous litters
  const [previousLitters, setPreviousLitters] = useState<PreviousLitter[]>(
    existingCat?.previousLitters || []
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CatFormData>({
    resolver: zodResolver(catSchema),
    defaultValues: existingCat ? {
      name: existingCat.name,
      breed: existingCat.breed,
      gender: existingCat.gender,
      birthDate: existingCat.birthDate,
      chipNumber: existingCat.chipNumber || '',
      registration: existingCat.registration || '',
      color: existingCat.color,
      emsCode: existingCat.emsCode || '',
      healthNotes: existingCat.healthNotes || '',
      imageUrl: existingCat.images[0] || '',
      pedigreeImageUrl: existingCat.pedigreeImage || '',
    } : {
      gender: 'female',
    },
  });

  const toggleHealthTest = (testId: string) => {
    setHealthTests(prev => prev.map(test => 
      test.id === testId ? { ...test, completed: !test.completed } : test
    ));
  };

  const updateTestDate = (testId: string, date: string) => {
    setHealthTests(prev => prev.map(test => 
      test.id === testId ? { ...test, date } : test
    ));
  };

  const addCustomTest = () => {
    if (!newTestName.trim()) return;
    const newTest: HealthTest = {
      id: crypto.randomUUID(),
      name: newTestName.trim(),
      completed: false,
    };
    setHealthTests(prev => [...prev, newTest]);
    setNewTestName('');
  };

  const removeCustomTest = (testId: string) => {
    if (DEFAULT_HEALTH_TESTS.some(t => t.id === testId)) return;
    setHealthTests(prev => prev.filter(test => test.id !== testId));
  };

  // Previous litter management
  const addPreviousLitter = () => {
    const newLitter: PreviousLitter = {
      id: crypto.randomUUID(),
      birthDate: '',
      kittenCount: 0,
    };
    setPreviousLitters(prev => [...prev, newLitter]);
  };

  const updatePreviousLitter = (litterId: string, field: keyof PreviousLitter, value: string | number) => {
    setPreviousLitters(prev => prev.map(litter =>
      litter.id === litterId ? { ...litter, [field]: value } : litter
    ));
  };

  const removePreviousLitter = (litterId: string) => {
    setPreviousLitters(prev => prev.filter(litter => litter.id !== litterId));
  };

  const pedigreeImageUrl = watch('pedigreeImageUrl');
  const imageUrl = watch('imageUrl');
  const currentGender = watch('gender');

  // Get potential mates (opposite gender)
  const potentialMates = cats.filter(c => 
    c.id !== id && c.gender !== currentGender
  );

  const selectedMate = potentialMates.find(c => c.id === selectedMateId);

  // Simple COI calculation placeholder
  const calculateCOI = () => {
    // This would need actual pedigree data to calculate properly
    return Math.random() * 5; // Placeholder
  };

  const parsePedigreeImage = useCallback(async (imageData: string, isUrl: boolean = false) => {
    setIsParsingPedigree(true);
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

      const pedigreeData = data.data;
      console.log('Pedigree data received:', pedigreeData);

      // Fill in form fields
      let fieldsUpdated = 0;
      if (pedigreeData.name) {
        setValue('name', pedigreeData.name);
        fieldsUpdated++;
      }
      if (pedigreeData.breed) {
        setValue('breed', pedigreeData.breed);
        fieldsUpdated++;
      }
      if (pedigreeData.emsCode) {
        setValue('emsCode', pedigreeData.emsCode);
        fieldsUpdated++;
      }
      if (pedigreeData.color) {
        setValue('color', pedigreeData.color);
        fieldsUpdated++;
      }
      if (pedigreeData.birthDate) {
        setValue('birthDate', pedigreeData.birthDate);
        fieldsUpdated++;
      }
      if (pedigreeData.registration) {
        setValue('registration', pedigreeData.registration);
        fieldsUpdated++;
      }
      if (pedigreeData.chipNumber) {
        setValue('chipNumber', pedigreeData.chipNumber);
        fieldsUpdated++;
      }
      if (pedigreeData.gender) {
        setValue('gender', pedigreeData.gender);
        fieldsUpdated++;
      }

      if (fieldsUpdated > 0) {
        toast.success(`${fieldsUpdated} felt fylt ut fra stamtavle`);
        // Collapse pedigree section after successful parse
        setPedigreeOpen(false);
      } else {
        toast.info('Ingen felt kunne ekstraheres fra stamtavlen');
      }
    } catch (err) {
      console.error('Error parsing pedigree:', err);
      toast.error('Feil ved analyse av stamtavle');
    } finally {
      setIsParsingPedigree(false);
    }
  }, [setValue]);

  const handleFileUpload = useCallback((file: File, field: 'imageUrl' | 'pedigreeImageUrl') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setValue(field, dataUrl);
      toast.success('Bilde lastet opp');
      
      if (field === 'pedigreeImageUrl') {
        await parsePedigreeImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }, [setValue, parsePedigreeImage]);

  const handlePaste = useCallback(async (field: 'imageUrl' | 'pedigreeImageUrl') => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            setValue(field, dataUrl);
            toast.success('Bilde limt inn fra utklippstavlen');
            
            if (field === 'pedigreeImageUrl') {
              await parsePedigreeImage(dataUrl);
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      toast.error('Ingen bilde funnet i utklippstavlen');
    } catch {
      toast.error('Kunne ikke lese utklippstavlen');
    }
  }, [setValue, parsePedigreeImage]);

  const handlePedigreeUrlBlur = useCallback(async () => {
    const url = watch('pedigreeImageUrl');
    if (url && url.startsWith('http') && !url.startsWith('data:')) {
      await parsePedigreeImage(url, true);
    }
  }, [watch, parsePedigreeImage]);

  const onSubmit = (data: CatFormData) => {
    const catData = {
      id: existingCat?.id || crypto.randomUUID(),
      name: data.name,
      breed: data.breed,
      gender: data.gender,
      birthDate: data.birthDate,
      chipNumber: data.chipNumber || undefined,
      registration: data.registration || undefined,
      color: data.color,
      emsCode: data.emsCode || undefined,
      healthTests: healthTests,
      healthNotes: data.healthNotes || undefined,
      images: data.imageUrl ? [data.imageUrl] : [],
      pedigreeImage: data.pedigreeImageUrl || undefined,
      previousLitters: previousLitters.filter(l => l.birthDate), // Only save litters with dates
      createdAt: existingCat?.createdAt || new Date().toISOString(),
    };

    if (isEditing) {
      updateCat(catData);
      toast.success('Katt oppdatert');
    } else {
      addCat(catData);
      toast.success('Katt lagt til');
    }
    navigate('/cats');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cats"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title">{isEditing ? `Rediger ${existingCat.name}` : 'Legg til katt'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="stat-card space-y-6">
        {/* Sammenleggbar stamtavle-seksjon */}
        <Collapsible open={pedigreeOpen} onOpenChange={setPedigreeOpen}>
          <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Stamtavle (bilde) - Fyller ut felt automatisk
                  {pedigreeImageUrl && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      ✓ Lastet
                    </span>
                  )}
                </Label>
                {pedigreeOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Input 
                  {...register('pedigreeImageUrl')} 
                  placeholder="Stamtavle-URL eller last opp"
                  className="flex-1"
                  onBlur={handlePedigreeUrlBlur}
                  disabled={isParsingPedigree}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={pedigreeInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'pedigreeImageUrl');
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => pedigreeInputRef.current?.click()}
                  title="Last opp stamtavle"
                  disabled={isParsingPedigree}
                >
                  {isParsingPedigree ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => handlePaste('pedigreeImageUrl')}
                  title="Lim inn fra utklippstavle"
                  disabled={isParsingPedigree}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              {pedigreeImageUrl && pedigreeImageUrl.startsWith('data:') && (
                <img src={pedigreeImageUrl} alt="Stamtavle forhåndsvisning" className="mt-2 max-h-48 object-contain rounded-lg border" />
              )}
              {isParsingPedigree && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyserer stamtavle med AI...
                </p>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Rase *</Label>
            <Input id="breed" {...register('breed')} placeholder="f.eks. Maine Coon" />
            {errors.breed && <p className="text-sm text-destructive">{errors.breed.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Kjønn *</Label>
            <Select
              value={watch('gender')}
              onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">♀ Hunn</SelectItem>
                <SelectItem value="male">♂ Hann</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Fødselsdato *</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
            {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emsCode">EMS-kode</Label>
            <Input id="emsCode" {...register('emsCode')} placeholder="f.eks. NFO n 09 24" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Farge *</Label>
            <Input id="color" {...register('color')} placeholder="f.eks. Brown tabby" />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chipNumber">Chip-nummer</Label>
            <Input id="chipNumber" {...register('chipNumber')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration">Registrering</Label>
            <Input id="registration" {...register('registration')} placeholder="Register & nummer" />
          </div>

          {/* Kattebilde med drag-and-drop */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Kattebilde</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDraggingImage 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingImage(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file, 'imageUrl');
              }}
            >
              <div className="flex gap-2">
                <Input 
                  {...register('imageUrl')} 
                  placeholder="Bilde-URL, dra inn, eller lim inn" 
                  className="flex-1"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={imageInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'imageUrl');
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  title="Last opp bilde"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => handlePaste('imageUrl')}
                  title="Lim inn fra utklippstavle (Ctrl+V)"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              {isDraggingImage && (
                <p className="text-sm text-primary text-center mt-2">Slipp bildet her</p>
              )}
              {imageUrl && imageUrl.startsWith('data:') && (
                <img src={imageUrl} alt="Forhåndsvisning" className="mt-3 h-24 w-24 object-cover rounded-lg" />
              )}
            </div>
          </div>

          {/* Tidligere kull - kun for hunner */}
          {currentGender === 'female' && (
            <div className="space-y-4 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Tidligere kull</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPreviousLitter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til kull
                </Button>
              </div>
              
              {previousLitters.length > 0 ? (
                <div className="space-y-3">
                  {previousLitters.map((litter, index) => (
                    <div key={litter.id} className="p-3 rounded-lg border bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Kull {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePreviousLitter(litter.id)}
                          className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Fødselsdato</Label>
                          <Input
                            type="date"
                            value={litter.birthDate}
                            onChange={(e) => updatePreviousLitter(litter.id, 'birthDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Antall kattunger</Label>
                          <Input
                            type="number"
                            min="0"
                            value={litter.kittenCount}
                            onChange={(e) => updatePreviousLitter(litter.id, 'kittenCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Far (navn)</Label>
                          <Input
                            value={litter.fatherName || ''}
                            onChange={(e) => updatePreviousLitter(litter.id, 'fatherName', e.target.value)}
                            placeholder="Hannens navn"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs">Notater</Label>
                        <Input
                          value={litter.notes || ''}
                          onChange={(e) => updatePreviousLitter(litter.id, 'notes', e.target.value)}
                          placeholder="Eventuelle notater..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen tidligere kull registrert</p>
              )}
            </div>
          )}

          {/* Testparring */}
          {isEditing && (
            <div className="space-y-4 sm:col-span-2">
              <Dialog open={testMatingOpen} onOpenChange={setTestMatingOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Testparring - Se innavlsprosent
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Testparring for {existingCat?.name}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Velg {currentGender === 'female' ? 'hann' : 'hunn'}</Label>
                      <Select value={selectedMateId} onValueChange={setSelectedMateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg katt..." />
                        </SelectTrigger>
                        <SelectContent>
                          {potentialMates.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name} ({cat.emsCode || cat.color})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedMate && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">
                              {currentGender === 'female' ? '♀ Mor' : '♂ Far'}
                            </h4>
                            <p className="text-sm">{existingCat?.name}</p>
                            <p className="text-xs text-muted-foreground">{existingCat?.emsCode || existingCat?.color}</p>
                            {existingCat?.pedigreeImage && (
                              <img 
                                src={existingCat.pedigreeImage} 
                                alt="Stamtavle" 
                                className="mt-2 max-h-32 object-contain rounded"
                              />
                            )}
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">
                              {currentGender === 'female' ? '♂ Far' : '♀ Mor'}
                            </h4>
                            <p className="text-sm">{selectedMate.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedMate.emsCode || selectedMate.color}</p>
                            {selectedMate.pedigreeImage && (
                              <img 
                                src={selectedMate.pedigreeImage} 
                                alt="Stamtavle" 
                                className="mt-2 max-h-32 object-contain rounded"
                              />
                            )}
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-muted/50">
                          <h4 className="font-medium mb-2">Beregnet innavlskoeffisient (COI)</h4>
                          <p className="text-2xl font-bold text-primary">
                            {calculateCOI().toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            * Dette er en foreløpig beregning. For nøyaktig COI trengs komplett stamtavle med 5+ generasjoner.
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Mulige farger på kattunger</h4>
                          <p className="text-sm text-muted-foreground">
                            Basert på foreldrenes EMS-koder kan kattungene få følgende farger:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {existingCat?.emsCode && selectedMate.emsCode ? (
                              <span className="text-sm px-2 py-1 bg-primary/10 rounded">
                                Krever genetisk analyse
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Legg inn EMS-koder for å se mulige farger
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {potentialMates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ingen {currentGender === 'female' ? 'hanner' : 'hunner'} registrert. 
                        Legg til flere katter for å teste parringer.
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Helsetester */}
          <div className="space-y-4 sm:col-span-2">
            <Label>Helsetester</Label>
            <div className="space-y-3">
              {healthTests.map((test) => (
                <div key={test.id} className="flex items-center gap-4 p-3 rounded-lg border bg-background">
                  <Checkbox
                    id={test.id}
                    checked={test.completed}
                    onCheckedChange={() => toggleHealthTest(test.id)}
                  />
                  <label 
                    htmlFor={test.id} 
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {test.name}
                  </label>
                  <Input
                    type="date"
                    value={test.date || ''}
                    onChange={(e) => updateTestDate(test.id, e.target.value)}
                    className="w-40"
                    placeholder="Dato"
                  />
                  {!DEFAULT_HEALTH_TESTS.some(t => t.id === test.id) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomTest(test.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Legg til ny test */}
            <div className="flex gap-2">
              <Input
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                placeholder="Legg til ny test..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTest();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomTest}
                disabled={!newTestName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Legg til
              </Button>
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="healthNotes">Andre helsenotater</Label>
            <Textarea id="healthNotes" {...register('healthNotes')} rows={3} placeholder="Tilleggsinformasjon om helse..." />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/cats">Avbryt</Link>
          </Button>
          <Button type="submit" disabled={isParsingPedigree}>
            {isEditing ? 'Lagre endringer' : 'Legg til katt'}
          </Button>
        </div>
      </form>
    </div>
  );
}