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

const catSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  breed: z.string().min(1, 'Breed is required'),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().min(1, 'Birth date is required'),
  chipNumber: z.string().optional(),
  registration: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  healthNotes: z.string().optional(),
  imageUrl: z.string().optional(),
  pedigreeImageUrl: z.string().optional(),
});

type CatFormData = z.infer<typeof catSchema>;

export default function CatForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, addCat, updateCat } = useData();
  
  const existingCat = id ? cats.find(c => c.id === id) : null;
  const isEditing = !!existingCat;

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
      healthNotes: data.healthNotes || undefined,
      images: data.imageUrl ? [data.imageUrl] : [],
      pedigreeImage: data.pedigreeImageUrl || undefined,
      createdAt: existingCat?.createdAt || new Date().toISOString(),
    };

    if (isEditing) {
      updateCat(catData);
      toast.success('Cat updated successfully');
    } else {
      addCat(catData);
      toast.success('Cat added successfully');
    }
    navigate('/cats');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cats"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title">{isEditing ? `Edit ${existingCat.name}` : 'Add Cat'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="stat-card space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Breed *</Label>
            <Input id="breed" {...register('breed')} placeholder="e.g. Maine Coon" />
            {errors.breed && <p className="text-sm text-destructive">{errors.breed.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={watch('gender')}
              onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">♀ Female</SelectItem>
                <SelectItem value="male">♂ Male</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth Date *</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
            {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <Input id="color" {...register('color')} placeholder="e.g. Brown tabby" />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chipNumber">Chip Number</Label>
            <Input id="chipNumber" {...register('chipNumber')} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="registration">Registration</Label>
            <Input id="registration" {...register('registration')} placeholder="Registry & number" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" {...register('imageUrl')} placeholder="https://..." />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pedigreeImageUrl">Pedigree Image URL (Stamtavle)</Label>
            <Input id="pedigreeImageUrl" {...register('pedigreeImageUrl')} placeholder="https://..." />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="healthNotes">Health Notes</Label>
            <Textarea id="healthNotes" {...register('healthNotes')} rows={4} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/cats">Cancel</Link>
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Add Cat'}</Button>
        </div>
      </form>
    </div>
  );
}
