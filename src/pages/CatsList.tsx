import { Link } from 'react-router-dom';
import { Plus, Cat as CatIcon, Loader2 } from 'lucide-react';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CatsList() {
  const { data: cats = [], isLoading } = useCats();

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
        <h1 className="page-title">Katter</h1>
        <Button asChild>
          <Link to="/cats/new"><Plus className="h-4 w-4 mr-2" /> Legg til katt</Link>
        </Button>
      </div>

      {cats.length === 0 ? (
        <div className="empty-state">
          <CatIcon className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Ingen katter ennå</p>
          <p className="text-sm mb-4">Legg til din første katt for å komme i gang</p>
          <Button asChild>
            <Link to="/cats/new"><Plus className="h-4 w-4 mr-2" /> Legg til katt</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map(cat => (
            <Link
              key={cat.id}
              to={`/cats/${cat.id}`}
              className="stat-card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {cat.images[0] ? (
                    <img src={cat.images[0]} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <CatIcon className="h-8 w-8 text-accent-foreground/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{cat.breed}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={cat.gender === 'female' ? 'secondary' : 'outline'}>
                      {cat.gender === 'female' ? '♀ Hunn' : '♂ Hann'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{cat.emsCode || cat.color}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}