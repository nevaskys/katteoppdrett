import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCats } from '@/hooks/useCats';
import { useLitter, useAddLitter, useUpdateLitter } from '@/hooks/useLitters';
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
import { toast } from 'sonner';

const litterSchema = z.object({
  motherId: z.string().min(1, 'Mor er påkrevd'),
  fatherId: z.string().min(1, 'Far er påkrevd'),
  birthDate: z.string().min(1, 'Fødselsdato er påkrevd'),
  count: z.coerce.number().min(1, 'Antall må være minst 1'),
  notes: z.string().optional(),
});

type LitterFormData = z.infer<typeof litterSchema>;

export default function LitterForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: existingLitter, isLoading: litterLoading } = useLitter(id);
  const addLitterMutation = useAddLitter();
  const updateLitterMutation = useUpdateLitter();
  
  const isEditing = !!existingLitter;
  const isLoading = catsLoading || litterLoading;

  const femaleCats = cats.filter(c => c.gender === 'female');
  const maleCats = cats.filter(c => c.gender === 'male');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LitterFormData>({
    resolver: zodResolver(litterSchema),
    defaultValues: existingLitter ? {
      motherId: existingLitter.motherId,
      fatherId: existingLitter.fatherId,
      birthDate: existingLitter.birthDate,
      count: existingLitter.count,
      notes: existingLitter.notes || '',
    } : {},
  });

  const onSubmit = (data: LitterFormData) => {
    const litterData = {
      motherId: data.motherId,
      fatherId: data.fatherId,
      birthDate: data.birthDate,
      count: data.count,
      notes: data.notes || undefined,
      kittens: existingLitter?.kittens || [],
    };

    if (isEditing && existingLitter) {
      updateLitterMutation.mutate({ ...litterData, id: existingLitter.id, createdAt: existingLitter.createdAt }, {
        onSuccess: () => {
          toast.success('Kull oppdatert');
          navigate('/litters');
        },
      });
    } else {
      addLitterMutation.mutate(litterData as any, {
        onSuccess: () => {
          toast.success('Kull lagt til');
          navigate('/litters');
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

  if (cats.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-lg font-medium">Legg til katter først</p>
        <p className="text-sm mb-4">Du må legge til foreldrekatter før du kan opprette et kull</p>
        <Button asChild>
          <Link to="/cats/new">Legg til katt</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/litters"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title">{isEditing ? 'Rediger kull' : 'Legg til kull'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="stat-card space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mor *</Label>
            <Select
              value={watch('motherId')}
              onValueChange={(value) => setValue('motherId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg mor" />
              </SelectTrigger>
              <SelectContent>
                {femaleCats.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.motherId && <p className="text-sm text-destructive">{errors.motherId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Far *</Label>
            <Select
              value={watch('fatherId')}
              onValueChange={(value) => setValue('fatherId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg far" />
              </SelectTrigger>
              <SelectContent>
                {maleCats.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fatherId && <p className="text-sm text-destructive">{errors.fatherId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Fødselsdato *</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
            {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Antall kattunger *</Label>
            <Input id="count" type="number" min="1" {...register('count')} />
            {errors.count && <p className="text-sm text-destructive">{errors.count.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/litters">Avbryt</Link>
          </Button>
          <Button type="submit">{isEditing ? 'Lagre endringer' : 'Legg til kull'}</Button>
        </div>
      </form>
    </div>
  );
}
