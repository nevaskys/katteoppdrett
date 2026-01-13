import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Calculator } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useCats } from '@/hooks/useCats';
import { useLitterById, useCreateLitter, useUpdateLitterNew } from '@/hooks/useLittersNew';
import { useKittensByLitter, useSaveKittens } from '@/hooks/useKittens';
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
import { LitterStatus, LITTER_STATUS_CONFIG, MotherWeightEntry, PregnancyNoteEntry } from '@/types/litter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PregnancyCalendar } from '@/components/litters/PregnancyCalendar';
import { MotherWeightLog } from '@/components/litters/MotherWeightLog';
import { PregnancyNotesLog } from '@/components/litters/PregnancyNotesLog';
import { KittenEditor, KittenData } from '@/components/litters/KittenEditor';
import { ParentImages } from '@/components/litters/ParentImages';
import { LitterReceiptsEditor } from '@/components/litters/LitterReceiptsEditor';
import { ReceiptsButton } from '@/components/litters/ReceiptsButton';

const GESTATION_DAYS = 65;

const litterSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  status: z.enum(['planned', 'pending', 'active', 'completed']),
  motherId: z.string().optional(),
  fatherId: z.string().optional(),
  externalFatherName: z.string().optional(),
  externalFatherPedigreeUrl: z.string().optional(),
  matingDateFrom: z.string().optional(),
  matingDateTo: z.string().optional(),
  expectedDate: z.string().optional(),
  birthDate: z.string().optional(),
  completionDate: z.string().optional(),
  reasoning: z.string().optional(),
  inbreedingCoefficient: z.coerce.number().optional(),
  bloodTypeNotes: z.string().optional(),
  alternativeCombinations: z.string().optional(),
  matingNotes: z.string().optional(),
  pregnancyNotes: z.string().optional(),
  kittenCount: z.coerce.number().optional(),
  nrrRegistered: z.boolean().optional(),
  evaluation: z.string().optional(),
  buyersInfo: z.string().optional(),
  notes: z.string().optional(),
});

type LitterFormData = z.infer<typeof litterSchema>;

export default function LitterForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: existingLitter, isLoading: litterLoading } = useLitterById(id);
  const { data: existingKittens = [], isLoading: kittensLoading } = useKittensByLitter(id);
  const createLitterMutation = useCreateLitter();
  const updateLitterMutation = useUpdateLitterNew();
  const saveKittensMutation = useSaveKittens();
  
  const [motherWeightLog, setMotherWeightLog] = useState<MotherWeightEntry[]>([]);
  const [pregnancyNotesLog, setPregnancyNotesLog] = useState<PregnancyNoteEntry[]>([]);
  const [kittensData, setKittensData] = useState<KittenData[]>([]);
  const [litterImages, setLitterImages] = useState<string[]>([]);
  
  const isEditing = !!id && !!existingLitter;
  const isLoading = catsLoading || (id && litterLoading) || (id && kittensLoading);

  const femaleCats = cats.filter(c => c.gender === 'female');
  const maleCats = cats.filter(c => c.gender === 'male');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<LitterFormData>({
    resolver: zodResolver(litterSchema),
    defaultValues: {
      status: 'planned',
      nrrRegistered: false,
    },
  });

  useEffect(() => {
    if (existingLitter) {
      reset({
        name: existingLitter.name,
        status: existingLitter.status,
        motherId: existingLitter.motherId || undefined,
        fatherId: existingLitter.fatherId || undefined,
        externalFatherName: existingLitter.externalFatherName || undefined,
        externalFatherPedigreeUrl: existingLitter.externalFatherPedigreeUrl || undefined,
        matingDateFrom: existingLitter.matingDateFrom || existingLitter.matingDate || undefined,
        matingDateTo: existingLitter.matingDateTo || undefined,
        expectedDate: existingLitter.expectedDate || undefined,
        birthDate: existingLitter.birthDate || undefined,
        completionDate: existingLitter.completionDate || undefined,
        reasoning: existingLitter.reasoning || undefined,
        inbreedingCoefficient: existingLitter.inbreedingCoefficient || undefined,
        bloodTypeNotes: existingLitter.bloodTypeNotes || undefined,
        alternativeCombinations: existingLitter.alternativeCombinations || undefined,
        matingNotes: existingLitter.matingNotes || undefined,
        pregnancyNotes: existingLitter.pregnancyNotes || undefined,
        kittenCount: existingLitter.kittenCount || undefined,
        nrrRegistered: existingLitter.nrrRegistered,
        evaluation: existingLitter.evaluation || undefined,
        buyersInfo: existingLitter.buyersInfo || undefined,
        notes: existingLitter.notes || undefined,
      });
      setMotherWeightLog(existingLitter.motherWeightLog || []);
      setPregnancyNotesLog(existingLitter.pregnancyNotesLog || []);
      setLitterImages(existingLitter.images || []);
    }
  }, [existingLitter, reset]);

  // Load existing kittens
  useEffect(() => {
    if (existingKittens && existingKittens.length > 0) {
      setKittensData(existingKittens.map(k => ({
        id: k.id,
        name: k.name || '',
        gender: k.gender as 'male' | 'female' | null,
        color: k.color || '',
        emsCode: k.ems_code || '',
        status: (k.status as KittenData['status']) || 'available',
        reservedBy: k.reserved_by || '',
        notes: k.notes || '',
      })));
    }
  }, [existingKittens]);

  const currentStatus = watch('status');
  const motherId = watch('motherId');
  const fatherId = watch('fatherId');
  const matingDateFrom = watch('matingDateFrom');
  const matingDateTo = watch('matingDateTo');
  const expectedDate = watch('expectedDate');
  const birthDate = watch('birthDate');
  const kittenCount = watch('kittenCount');

  // Find selected cat names for display
  const selectedMother = femaleCats.find(c => c.id === motherId);
  const selectedFather = maleCats.find(c => c.id === fatherId);

  // Auto-calculate expected date when mating date changes
  const handleCalculateExpectedDate = () => {
    if (matingDateFrom) {
      const calculated = addDays(new Date(matingDateFrom), GESTATION_DAYS);
      setValue('expectedDate', format(calculated, 'yyyy-MM-dd'));
      toast.success(`Forventet fødsel beregnet: ${format(calculated, 'd. MMM yyyy')}`);
    }
  };

  const onSubmit = (data: LitterFormData) => {
    const litterData = {
      name: data.name,
      status: data.status as LitterStatus,
      motherId: data.motherId || null,
      fatherId: data.fatherId || null,
      externalFatherName: data.externalFatherName || null,
      externalFatherPedigreeUrl: data.externalFatherPedigreeUrl || null,
      matingDateFrom: data.matingDateFrom || null,
      matingDateTo: data.matingDateTo || null,
      matingDate: data.matingDateFrom || null, // Keep legacy field in sync
      expectedDate: data.expectedDate || null,
      birthDate: data.birthDate || null,
      completionDate: data.completionDate || null,
      reasoning: data.reasoning || null,
      inbreedingCoefficient: data.inbreedingCoefficient || null,
      bloodTypeNotes: data.bloodTypeNotes || null,
      alternativeCombinations: data.alternativeCombinations || null,
      matingNotes: data.matingNotes || null,
      pregnancyNotes: data.pregnancyNotes || null,
      pregnancyNotesLog: pregnancyNotesLog,
      motherWeightLog: motherWeightLog,
      kittenCount: data.kittenCount || null,
      nrrRegistered: data.nrrRegistered || false,
      evaluation: data.evaluation || null,
      buyersInfo: data.buyersInfo || null,
      notes: data.notes || null,
      images: litterImages,
    };

    const saveKittensIfNeeded = async (litterId: string) => {
      if (kittensData.length > 0) {
        await saveKittensMutation.mutateAsync({
          litterId,
          kittens: kittensData.map(k => ({
            id: k.id,
            litterId,
            name: k.name,
            gender: k.gender,
            color: k.color,
            emsCode: k.emsCode,
            status: k.status,
            reservedBy: k.reservedBy,
            notes: k.notes,
          })),
        });
      }
    };

    if (isEditing && existingLitter) {
      updateLitterMutation.mutate({ ...litterData, id: existingLitter.id }, {
        onSuccess: async () => {
          await saveKittensIfNeeded(existingLitter.id);
          toast.success('Kull oppdatert');
          navigate(`/litters/${existingLitter.id}`);
        },
        onError: (error) => {
          toast.error('Kunne ikke oppdatere kull');
          console.error(error);
        },
      });
    } else {
      createLitterMutation.mutate(litterData, {
        onSuccess: async (newLitter) => {
          await saveKittensIfNeeded(newLitter.id);
          toast.success('Kull opprettet');
          navigate(`/litters/${newLitter.id}`);
        },
        onError: (error) => {
          toast.error('Kunne ikke opprette kull');
          console.error(error);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/litters"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title">{isEditing ? 'Rediger kull' : 'Nytt kull'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Parent images at the top */}
        {(motherId || fatherId) && (
          <ParentImages
            mother={selectedMother || null}
            father={selectedFather || null}
          />
        )}

        <div className="bg-card border rounded-lg p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn på kull *</Label>
              <Input 
                id="name" 
                {...register('name')} 
                placeholder="F.eks. 'A-kullet 2024'" 
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={currentStatus}
                onValueChange={(value) => setValue('status', value as LitterStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LITTER_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mor</Label>
              <Select
                value={motherId || '__none__'}
                onValueChange={(value) => setValue('motherId', value === '__none__' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg mor">
                    {selectedMother?.name || 'Velg mor'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Velg mor</SelectItem>
                  {femaleCats.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Far (egen katt)</Label>
              <Select
                value={fatherId || '__none__'}
                onValueChange={(value) => setValue('fatherId', value === '__none__' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg far">
                    {selectedFather?.name || 'Velg far'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Velg far</SelectItem>
                  {maleCats.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalFatherName">Ekstern far (navn)</Label>
              <Input 
                id="externalFatherName" 
                {...register('externalFatherName')} 
                placeholder="Hvis far ikke er registrert"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalFatherPedigreeUrl">Stamtavle-URL (ekstern far)</Label>
              <Input 
                id="externalFatherPedigreeUrl" 
                {...register('externalFatherPedigreeUrl')} 
                placeholder="Link til stamtavle"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="planning" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="planning">Planlegging</TabsTrigger>
            <TabsTrigger value="mating">Parring</TabsTrigger>
            <TabsTrigger value="pregnancy">Drektighet</TabsTrigger>
            <TabsTrigger value="birth">Fødsel</TabsTrigger>
            <TabsTrigger value="completion">Avslutning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="planning" className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-medium">Planleggingsfase</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reasoning">Begrunnelse for kombinasjonen</Label>
                <Textarea 
                  id="reasoning" 
                  {...register('reasoning')} 
                  rows={3}
                  placeholder="Hvorfor velger du denne kombinasjonen?"
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inbreedingCoefficient">Innavlsprosent (%)</Label>
                  <Input 
                    id="inbreedingCoefficient" 
                    type="number" 
                    step="0.01"
                    {...register('inbreedingCoefficient')} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bloodTypeNotes">Blodtype / NI-vurdering</Label>
                <Textarea 
                  id="bloodTypeNotes" 
                  {...register('bloodTypeNotes')} 
                  rows={2}
                  placeholder="Notater om blodtype og NI-risiko"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alternativeCombinations">Alternative kombinasjoner</Label>
                <Textarea 
                  id="alternativeCombinations" 
                  {...register('alternativeCombinations')} 
                  rows={2}
                  placeholder="Andre kombinasjoner du vurderer"
                />
              </div>
            </div>
            
            {/* Receipts button at bottom left */}
            {isEditing && existingLitter && (
              <div className="border-t pt-4 flex justify-start">
                <ReceiptsButton
                  images={litterImages}
                  onChange={setLitterImages}
                  litterId={existingLitter.id}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mating" className="bg-card border rounded-lg p-6 space-y-6">
            <h3 className="text-sm font-medium">Parringsinformasjon</h3>
            
            <div className="space-y-4">
              <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-3">
                  Parringsdatoer
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matingDateFrom">Fra dato</Label>
                    <Input 
                      id="matingDateFrom" 
                      type="date" 
                      {...register('matingDateFrom')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matingDateTo">Til dato (valgfritt)</Label>
                    <Input 
                      id="matingDateTo" 
                      type="date" 
                      {...register('matingDateTo')} 
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="expectedDate">Forventet fødsel</Label>
                    <Input 
                      id="expectedDate" 
                      type="date" 
                      {...register('expectedDate')} 
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCalculateExpectedDate}
                    disabled={!matingDateFrom}
                    className="mt-6"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Beregn ({GESTATION_DAYS} dager)
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="matingNotes">Parringsnotater</Label>
                <Textarea 
                  id="matingNotes" 
                  {...register('matingNotes')} 
                  rows={4}
                  placeholder="Observasjoner fra parringen, antall parringer, hvordan det gikk..."
                />
              </div>
            </div>
            
            {/* Receipts button at bottom left */}
            {isEditing && existingLitter && (
              <div className="border-t pt-4 flex justify-start">
                <ReceiptsButton
                  images={litterImages}
                  onChange={setLitterImages}
                  litterId={existingLitter.id}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pregnancy" className="bg-card border rounded-lg p-6 space-y-6">
            <h3 className="text-sm font-medium">Drektighetsoppfølging</h3>
            
            <div className="space-y-4">
              {/* Show pregnancy calendar if mating date is set */}
              {matingDateFrom && (
                <PregnancyCalendar
                  matingDateFrom={matingDateFrom}
                  matingDateTo={matingDateTo}
                  expectedDate={expectedDate}
                  birthDate={birthDate}
                />
              )}
              
              {/* Pregnancy notes log */}
              <PregnancyNotesLog
                entries={pregnancyNotesLog}
                onChange={setPregnancyNotesLog}
              />
              
              {/* Mother weight log */}
              <div className="border-t pt-4">
                <MotherWeightLog
                  entries={motherWeightLog}
                  onChange={setMotherWeightLog}
                />
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <Label htmlFor="pregnancyNotes">Generelle drektighetsnotater (eldre format)</Label>
                <Textarea 
                  id="pregnancyNotes" 
                  {...register('pregnancyNotes')} 
                  rows={3}
                  placeholder="Eldre notater..."
                  className="text-muted-foreground"
                />
              </div>
            </div>
            
            {/* Receipts button at bottom left */}
            {isEditing && existingLitter && (
              <div className="border-t pt-4 flex justify-start">
                <ReceiptsButton
                  images={litterImages}
                  onChange={setLitterImages}
                  litterId={existingLitter.id}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="birth" className="bg-card border rounded-lg p-6 space-y-6">
            <h3 className="text-sm font-medium">Fødsel og kattunger</h3>
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fødselsdato</Label>
                  <Input id="birthDate" type="date" {...register('birthDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kittenCount">Antall kattunger</Label>
                  <Input id="kittenCount" type="number" min="0" {...register('kittenCount')} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Fødselsnotater / Generelle notater</Label>
                <Textarea 
                  id="notes" 
                  {...register('notes')} 
                  rows={4}
                  placeholder="Notater om fødselen, NI-observasjoner, helse..."
                />
              </div>
              
              {/* Kitten details editor */}
              <div className="border-t pt-6">
                <KittenEditor
                  kittens={kittensData}
                  onChange={setKittensData}
                  suggestedCount={kittenCount}
                />
              </div>
            </div>
            
            {/* Receipts button at bottom left */}
            {isEditing && existingLitter && (
              <div className="border-t pt-4 flex justify-start">
                <ReceiptsButton
                  images={litterImages}
                  onChange={setLitterImages}
                  litterId={existingLitter.id}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completion" className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-medium">Avslutning og arkiv</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completionDate">Flyttedato siste kattunge</Label>
                  <Input id="completionDate" type="date" {...register('completionDate')} />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox 
                    id="nrrRegistered" 
                    checked={watch('nrrRegistered')} 
                    onCheckedChange={(checked) => setValue('nrrRegistered', checked as boolean)}
                  />
                  <Label htmlFor="nrrRegistered" className="text-sm font-normal">
                    Registrert i NRR
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyersInfo">Kjøpere / Fôrverter</Label>
                <Textarea 
                  id="buyersInfo" 
                  {...register('buyersInfo')} 
                  rows={3}
                  placeholder="Informasjon om hvem som har fått kattunger"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="evaluation">Evaluering av kombinasjonen</Label>
                <Textarea 
                  id="evaluation" 
                  {...register('evaluation')} 
                  rows={4}
                  placeholder="Læringspunkter, om kombinasjonen bør gjentas..."
                />
              </div>
            </div>
            
            {/* Receipts button at bottom left */}
            {isEditing && existingLitter && (
              <div className="border-t pt-4 flex justify-start">
                <ReceiptsButton
                  images={litterImages}
                  onChange={setLitterImages}
                  litterId={existingLitter.id}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/litters">Avbryt</Link>
          </Button>
          <Button type="submit" disabled={createLitterMutation.isPending || updateLitterMutation.isPending}>
            {(createLitterMutation.isPending || updateLitterMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEditing ? 'Lagre endringer' : 'Opprett kull'}
          </Button>
        </div>
      </form>
    </div>
  );
}
