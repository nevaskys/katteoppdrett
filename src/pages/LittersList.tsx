import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LittersList() {
  const { litters, cats } = useData();

  const getCatName = (id: string) => cats.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Litters</h1>
        <Button asChild>
          <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Add Litter</Link>
        </Button>
      </div>

      {litters.length === 0 ? (
        <div className="empty-state">
          <Users className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">No litters yet</p>
          <p className="text-sm mb-4">Record your first litter</p>
          <Button asChild>
            <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Add Litter</Link>
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
                  {new Date(litter.birthDate).toLocaleDateString()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {litter.kittens.length} / {litter.count} kittens
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Dam:</span>{' '}
                  <span className="font-medium">{getCatName(litter.motherId)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Sire:</span>{' '}
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
