import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, Clipboard, Loader2, Sparkles, Plus, X } from 'lucide-react';
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
import { toast } from 'sonner';
import { useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HealthTest } from '@/types';

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
  
  const existingCat = id ? cats.find(c => c.id === id) : null;
  const isEditing = !!existingCat;

  // Initialize health tests from existing cat or defaults
  const [healthTests, setHealthTests] = useState<HealthTest[]>(() => {
    if (existingCat?.healthTests && existingCat.healthTests.length > 0) {
      return existingCat.healthTests;
    }
    return DEFAULT_HEALTH_TESTS.map(t => ({ ...t }));
  });

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
    // Only allow removing custom tests (not default ones)
    if (DEFAULT_HEALTH_TESTS.some(t => t.id === testId)) return;
    setHealthTests(prev => prev.filter(test => test.id !== testId));
  };

  const pedigreeImageUrl = watch('pedigreeImageUrl');
  const imageUrl = watch('imageUrl');

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
      
      // Auto-parse pedigree image
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
            
            // Auto-parse pedigree image
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
      healthTests: healthTests,
      healthNotes: data.healthNotes || undefined,
      images: data.imageUrl ? [data.imageUrl] : [],
      pedigreeImage: data.pedigreeImageUrl || undefined,
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
        {/* Stamtavle først - fordi den fyller ut andre felt */}
        <div className="space-y-2 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Stamtavle (bilde) - Fyller ut felt automatisk
          </Label>
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
        </div>

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
            <Label htmlFor="color">Farge *</Label>
            <Input id="color" {...register('color')} placeholder="f.eks. Brown tabby" />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chipNumber">Chip-nummer</Label>
            <Input id="chipNumber" {...register('chipNumber')} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="registration">Registrering</Label>
            <Input id="registration" {...register('registration')} placeholder="Register & nummer" />
          </div>

          {/* Kattebilde */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Kattebilde</Label>
            <div className="flex gap-2">
              <Input 
                {...register('imageUrl')} 
                placeholder="Bilde-URL eller last opp" 
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
                title="Lim inn fra utklippstavle"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            {imageUrl && imageUrl.startsWith('data:') && (
              <img src={imageUrl} alt="Forhåndsvisning" className="mt-2 h-24 w-24 object-cover rounded-lg" />
            )}
          </div>

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
