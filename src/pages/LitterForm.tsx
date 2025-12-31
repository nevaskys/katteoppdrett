import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useData } from '@/context/DataContext';
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
  motherId: z.string().min(1, 'Mother is required'),
  fatherId: z.string().min(1, 'Father is required'),
  birthDate: z.string().min(1, 'Birth date is required'),
  count: z.coerce.number().min(1, 'Count must be at least 1'),
  notes: z.string().optional(),
});

type LitterFormData = z.infer<typeof litterSchema>;

export default function LitterForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, litters, addLitter, updateLitter } = useData();
  
  const existingLitter = id ? litters.find(l => l.id === id) : null;
  const isEditing = !!existingLitter;

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
      id: existingLitter?.id || crypto.randomUUID(),
      motherId: data.motherId,
      fatherId: data.fatherId,
      birthDate: data.birthDate,
      count: data.count,
      notes: data.notes || undefined,
      kittens: existingLitter?.kittens || [],
      createdAt: existingLitter?.createdAt || new Date().toISOString(),
    };

    if (isEditing) {
      updateLitter(litterData);
      toast.success('Litter updated successfully');
    } else {
      addLitter(litterData);
      toast.success('Litter added successfully');
    }
    navigate('/litters');
  };

  if (cats.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-lg font-medium">Add cats first</p>
        <p className="text-sm mb-4">You need to add parent cats before creating a litter</p>
        <Button asChild>
          <Link to="/cats/new">Add Cat</Link>
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
        <h1 className="page-title">{isEditing ? 'Edit Litter' : 'Add Litter'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="stat-card space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dam (Mother) *</Label>
            <Select
              value={watch('motherId')}
              onValueChange={(value) => setValue('motherId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mother" />
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
            <Label>Sire (Father) *</Label>
            <Select
              value={watch('fatherId')}
              onValueChange={(value) => setValue('fatherId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select father" />
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
            <Label htmlFor="birthDate">Birth Date *</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
            {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Kitten Count *</Label>
            <Input id="count" type="number" min="1" {...register('count')} />
            {errors.count && <p className="text-sm text-destructive">{errors.count.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/litters">Cancel</Link>
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Add Litter'}</Button>
        </div>
      </form>
    </div>
  );
}
