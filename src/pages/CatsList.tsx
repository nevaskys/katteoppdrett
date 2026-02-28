import { Link } from 'react-router-dom';
import { Plus, Cat as CatIcon, Loader2 } from 'lucide-react';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CatsList() {
  const { data: cats = [], isLoading } = useCats();

  const femaleCats = cats.filter(cat => cat.gender === 'female');
  const maleCats = cats.filter(cat => cat.gender === 'male');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const CatCard = ({ cat }: { cat: typeof cats[0] }) => (
    <Link
      to={`/cats/${cat.id}`}
      className="stat-card hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
          {cat.images[0] ? (
            <img src={cat.images[0]} alt={cat.name} className="h-full w-full object-cover" />
          ) : (
            <CatIcon className="h-6 w-6 text-accent-foreground/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors break-words">
            {cat.name}
          </h3>
          <p className="text-sm text-muted-foreground">{cat.breed}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge 
              className={cat.gender === 'female' 
                ? 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200'
              }
            >
              {cat.gender === 'female' ? '♀ Hunn' : '♂ Hann'}
            </Badge>
            <span className="text-xs text-muted-foreground">{cat.emsCode || cat.color}</span>
          </div>
        </div>
      </div>
    </Link>
  );

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
        <div className="grid md:grid-cols-2 gap-8">
          {/* Hunnkatter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-100 text-pink-700 border-pink-200">♀ Hunnkatter</Badge>
              <span className="text-sm text-muted-foreground">({femaleCats.length})</span>
            </div>
            {femaleCats.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen hunnkatter registrert</p>
            ) : (
              <div className="space-y-3">
                {femaleCats.map(cat => (
                  <CatCard key={cat.id} cat={cat} />
                ))}
              </div>
            )}
          </div>

          {/* Hannkatter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">♂ Hannkatter</Badge>
              <span className="text-sm text-muted-foreground">({maleCats.length})</span>
            </div>
            {maleCats.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen hannkatter registrert</p>
            ) : (
              <div className="space-y-3">
                {maleCats.map(cat => (
                  <CatCard key={cat.id} cat={cat} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
