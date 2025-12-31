import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Scale } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Kitten, WeightEntry } from '@/types';
import { toast } from 'sonner';

export default function LitterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { litters, cats, updateLitter, deleteLitter } = useData();
  
  const litter = litters.find(l => l.id === id);
  const [kittenDialogOpen, setKittenDialogOpen] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [selectedKitten, setSelectedKitten] = useState<Kitten | null>(null);
  
  const [newKitten, setNewKitten] = useState<{ name: string; gender: 'male' | 'female'; color: string; markings: string }>({ name: '', gender: 'female', color: '', markings: '' });
  const [newWeight, setNewWeight] = useState({ date: new Date().toISOString().split('T')[0], weight: '' });

  if (!litter) {
    return (
      <div className="empty-state">
        <p>Litter not found</p>
        <Button asChild className="mt-4">
          <Link to="/litters">Back to Litters</Link>
        </Button>
      </div>
    );
  }

  const mother = cats.find(c => c.id === litter.motherId);
  const father = cats.find(c => c.id === litter.fatherId);

  const handleDelete = () => {
    deleteLitter(litter.id);
    navigate('/litters');
  };

  const handleAddKitten = () => {
    if (!newKitten.name || !newKitten.color) {
      toast.error('Name and color are required');
      return;
    }
    const kitten: Kitten = {
      id: crypto.randomUUID(),
      name: newKitten.name,
      gender: newKitten.gender,
      color: newKitten.color,
      markings: newKitten.markings || undefined,
      weightLog: [],
    };
    updateLitter({ ...litter, kittens: [...litter.kittens, kitten] });
    setNewKitten({ name: '', gender: 'female', color: '', markings: '' });
    setKittenDialogOpen(false);
    toast.success('Kitten added');
  };

  const handleAddWeight = () => {
    if (!selectedKitten || !newWeight.weight) return;
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      date: newWeight.date,
      weight: parseInt(newWeight.weight),
    };
    const updatedKittens = litter.kittens.map(k =>
      k.id === selectedKitten.id
        ? { ...k, weightLog: [...k.weightLog, entry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }
        : k
    );
    updateLitter({ ...litter, kittens: updatedKittens });
    setNewWeight({ date: new Date().toISOString().split('T')[0], weight: '' });
    setWeightDialogOpen(false);
    toast.success('Weight recorded');
  };

  const handleDeleteKitten = (kittenId: string) => {
    updateLitter({ ...litter, kittens: litter.kittens.filter(k => k.id !== kittenId) });
    toast.success('Kitten removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/litters"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title flex-1">Litter Details</h1>
        <Button variant="outline" asChild>
          <Link to={`/litters/${litter.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this litter?</AlertDialogTitle>
              <AlertDialogDescription>
                This will also delete all kitten records. This action cannot be undone.
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
        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-4">Parents</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Dam (Mother)</dt>
              <dd className="font-medium">
                {mother ? (
                  <Link to={`/cats/${mother.id}`} className="text-primary hover:underline">
                    {mother.name}
                  </Link>
                ) : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sire (Father)</dt>
              <dd className="font-medium">
                {father ? (
                  <Link to={`/cats/${father.id}`} className="text-primary hover:underline">
                    {father.name}
                  </Link>
                ) : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Birth Date</dt>
              <dd className="font-medium">{new Date(litter.birthDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expected Count</dt>
              <dd className="font-medium">{litter.count}</dd>
            </div>
          </dl>
          {litter.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{litter.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Kittens ({litter.kittens.length})</h2>
            <Dialog open={kittenDialogOpen} onOpenChange={setKittenDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Kitten</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Kitten</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newKitten.name}
                      onChange={e => setNewKitten(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={newKitten.gender}
                      onValueChange={value => setNewKitten(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
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
                    <Label>Color</Label>
                    <Input
                      value={newKitten.color}
                      onChange={e => setNewKitten(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Markings</Label>
                    <Input
                      value={newKitten.markings}
                      onChange={e => setNewKitten(prev => ({ ...prev, markings: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddKitten} className="w-full">Add Kitten</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {litter.kittens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No kittens recorded yet</p>
          ) : (
            <div className="space-y-3">
              {litter.kittens.map(kitten => (
                <div key={kitten.id} className="p-3 rounded-lg bg-accent/50 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{kitten.name}</span>
                      <Badge variant={kitten.gender === 'female' ? 'secondary' : 'outline'} className="text-xs">
                        {kitten.gender === 'female' ? '♀' : '♂'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {kitten.color}{kitten.markings && ` - ${kitten.markings}`}
                    </p>
                    {kitten.weightLog.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Latest: {kitten.weightLog[0].weight}g ({new Date(kitten.weightLog[0].date).toLocaleDateString()})
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog open={weightDialogOpen && selectedKitten?.id === kitten.id} onOpenChange={(open) => {
                      setWeightDialogOpen(open);
                      if (open) setSelectedKitten(kitten);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Scale className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Weight for {kitten.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={newWeight.date}
                              onChange={e => setNewWeight(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Weight (grams)</Label>
                            <Input
                              type="number"
                              value={newWeight.weight}
                              onChange={e => setNewWeight(prev => ({ ...prev, weight: e.target.value }))}
                            />
                          </div>
                          <Button onClick={handleAddWeight} className="w-full">Save Weight</Button>
                          {kitten.weightLog.length > 0 && (
                            <div className="pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Weight History</p>
                              <div className="space-y-1 max-h-32 overflow-auto">
                                {kitten.weightLog.map(w => (
                                  <div key={w.id} className="text-sm flex justify-between">
                                    <span className="text-muted-foreground">{new Date(w.date).toLocaleDateString()}</span>
                                    <span>{w.weight}g</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {kitten.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteKitten(kitten.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
