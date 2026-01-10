import { Link } from 'react-router-dom';
import { Plus, Users, Loader2 } from 'lucide-react';
import { useLittersGrouped } from '@/hooks/useLittersNew';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
import { LitterStatusSection } from '@/components/litters/LitterStatusSection';
import { LitterStatus } from '@/types/litter';

const STATUS_ORDER: LitterStatus[] = ['active', 'pending', 'planned', 'completed'];

export default function LittersList() {
  const { data: littersGrouped, isLoading: littersLoading } = useLittersGrouped();
  const { data: cats = [], isLoading: catsLoading } = useCats();

  const isLoading = littersLoading || catsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalLitters = littersGrouped?.all?.length || 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kull</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administrer kull fra planlegging til ferdig
          </p>
        </div>
        <Button asChild>
          <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Nytt kull</Link>
        </Button>
      </div>

      {totalLitters === 0 ? (
        <div className="empty-state">
          <Users className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Ingen kull ennå</p>
          <p className="text-sm mb-4">Start med å planlegge ditt første kull</p>
          <Button asChild>
            <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Nytt kull</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {STATUS_ORDER.map(status => (
            <LitterStatusSection
              key={status}
              status={status}
              litters={littersGrouped?.[status] || []}
              cats={cats}
              defaultExpanded={status !== 'completed'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
