import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { Plus, Cat as CatIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cat } from '@/types';

// One light query for the whole page: which litter letters belong to which cat.
function useLitterLettersByCat() {
  return useQuery({
    queryKey: ['litter-letters-by-cat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('litters')
        .select('name, mother_id, father_id')
        .order('name');
      if (error) throw error;
      const map = new Map<string, string[]>();
      const add = (catId: string | null, name: string) => {
        if (!catId || !name) return;
        const list = map.get(catId) ?? [];
        if (!list.includes(name)) list.push(name);
        map.set(catId, list);
      };
      (data ?? []).forEach((l: { name: string; mother_id: string | null; father_id: string | null }) => {
        add(l.mother_id, l.name);
        add(l.father_id, l.name);
      });
      map.forEach(list => list.sort((a, b) => a.localeCompare(b, 'nb')));
      return map;
    },
  });
}

export default function CatsList() {
  const { data: cats = [], isLoading } = useCats();
  const { data: litterLetters } = useLitterLettersByCat();

  const [showRetired, setShowRetired] = useState(false);
  const [showBorrowed, setShowBorrowed] = useState(false);
  const retiredCats = cats.filter(cat => cat.retired);
  const borrowedCats = cats.filter(cat => !cat.retired && cat.loanStatus === 'borrowed');
  const active = cats.filter(cat => !cat.retired && cat.loanStatus !== 'borrowed');
  const femaleCats = active.filter(cat => cat.gender === 'female');
  const maleCats = active.filter(cat => cat.gender === 'male');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const CatCard = ({ cat }: { cat: Cat }) => {
    const letters = litterLetters?.get(cat.id) ?? [];
    const born = cat.birthDate ? new Date(cat.birthDate).toLocaleDateString('nb-NO') : '';
    return (
      <Link
        to={`/cats/${cat.id}`}
        className="stat-card block hover:shadow-md transition-shadow group"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
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
              {born && <span className="text-xs text-muted-foreground">Født {born}</span>}
            </div>
            {letters.length > 0 && (
              <p className="text-sm text-foreground/80 mt-2">Kull {letters.join(', ')}</p>
            )}
            {cat.loanStatus === 'lent_out' && (
              <p className="text-xs text-muted-foreground mt-2">
                Lånt ut{cat.loanParty ? ` til ${cat.loanParty}` : ''}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6 bg-background">
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

      {borrowedCats.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <button
            onClick={() => setShowBorrowed(!showBorrowed)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showBorrowed ? '' : '-rotate-90'}`} />
            Lånt inn ({borrowedCats.length})
          </button>
          {showBorrowed && (
            <div className="grid md:grid-cols-2 gap-3 opacity-80">
              {borrowedCats.map(cat => <CatCard key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>
      )}

      {retiredCats.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <button
            onClick={() => setShowRetired(!showRetired)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showRetired ? '' : '-rotate-90'}`} />
            Kastrert / ikke lenger i avl ({retiredCats.length})
          </button>
          {showRetired && (
            <div className="grid md:grid-cols-2 gap-3 opacity-80">
              {retiredCats.map(cat => <CatCard key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
