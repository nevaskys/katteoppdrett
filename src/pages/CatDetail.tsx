import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Cat as CatIcon } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function CatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, deleteCat } = useData();
  
  const cat = cats.find(c => c.id === id);

  if (!cat) {
    return (
      <div className="empty-state">
        <p>Cat not found</p>
        <Button asChild className="mt-4">
          <Link to="/cats">Back to Cats</Link>
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteCat(cat.id);
    navigate('/cats');
  };

  const age = () => {
    const birth = new Date(cat.birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cats"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title flex-1">{cat.name}</h1>
        <Button variant="outline" asChild>
          <Link to={`/cats/${cat.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {cat.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the cat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="stat-card aspect-square flex items-center justify-center overflow-hidden">
            {cat.images[0] ? (
              <img src={cat.images[0]} alt={cat.name} className="h-full w-full object-cover" />
            ) : (
              <CatIcon className="h-24 w-24 text-muted-foreground/30" />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Breed</dt>
                <dd className="font-medium">{cat.breed}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Gender</dt>
                <dd>
                  <Badge variant={cat.gender === 'female' ? 'secondary' : 'outline'}>
                    {cat.gender === 'female' ? '♀ Female' : '♂ Male'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Birth Date</dt>
                <dd className="font-medium">{new Date(cat.birthDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Age</dt>
                <dd className="font-medium">{age()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Color</dt>
                <dd className="font-medium">{cat.color}</dd>
              </div>
              {cat.chipNumber && (
                <div>
                  <dt className="text-muted-foreground">Chip Number</dt>
                  <dd className="font-medium font-mono text-xs">{cat.chipNumber}</dd>
                </div>
              )}
              {cat.registration && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Registration</dt>
                  <dd className="font-medium">{cat.registration}</dd>
                </div>
              )}
            </dl>
          </div>

          {cat.healthNotes && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-2">Health Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cat.healthNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
