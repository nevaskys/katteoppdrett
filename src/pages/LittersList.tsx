import { Link } from 'react-router-dom';
import { Plus, Users, Loader2 } from 'lucide-react';
import { useLitters } from '@/hooks/useLitters';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LittersList() {
  const { data: litters = [], isLoading: littersLoading } = useLitters();
  const { data: cats = [], isLoading: catsLoading } = useCats();

  const isLoading = littersLoading || catsLoading;
  const getCatName = (id: string) => cats.find(c => c.id === id)?.name || 'Ukjent';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Kull</h1>
        <Button asChild>
          <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Legg til kull</Link>
        </Button>
      </div>

      {litters.length === 0 ? (
        <div className="empty-state">
          <Users className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Ingen kull ennå</p>
          <p className="text-sm mb-4">Registrer ditt første kull</p>
          <Button asChild>
            <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Legg til kull</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {litters.map(litter => (
            <Link
              key={litter.id}
              to={`/litters/${litter.id}`}
              className="stat-card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline">
                  {new Date(litter.birthDate).toLocaleDateString('nb-NO')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {litter.kittens.length} / {litter.count} kattunger
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Mor:</span>{' '}
                  <span className="font-medium">{getCatName(litter.motherId)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Far:</span>{' '}
                  <span className="font-medium">{getCatName(litter.fatherId)}</span>
                </p>
              </div>
              {litter.notes && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{litter.notes}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}