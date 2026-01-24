import { Cat, Scale } from 'lucide-react';
import { useKittensByLitter, DbKitten, useUpdateKittenComplication } from '@/hooks/useKittens';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { KittenComplicationTag, ComplicationType } from './KittenComplicationTag';
import { toast } from 'sonner';

interface KittenListProps {
  litterId: string;
  editable?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Tilgjengelig', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  reserved: { label: 'Reservert', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  sold: { label: 'Solgt', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  keeping: { label: 'Beholder', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
};

export function KittenList({ litterId, editable = true }: KittenListProps) {
  const { data: kittens = [], isLoading } = useKittensByLitter(litterId);
  const updateComplication = useUpdateKittenComplication();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (kittens.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg">
        <Cat className="h-10 w-10 mx-auto text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Ingen kattunger registrert ennå
        </p>
      </div>
    );
  }

  const getGenderLabel = (gender: string | null) => {
    if (gender === 'male') return '♂ Hann';
    if (gender === 'female') return '♀ Hunn';
    return 'Ukjent';
  };

  const getGenderColor = (gender: string | null) => {
    if (gender === 'male') return 'text-blue-600';
    if (gender === 'female') return 'text-pink-600';
    return 'text-muted-foreground';
  };

  const handleComplicationChange = (kittenId: string, value: ComplicationType) => {
    updateComplication.mutate(
      { kittenId, complicationType: value },
      {
        onSuccess: () => {
          toast.success(value ? 'Komplikasjon lagt til' : 'Komplikasjon fjernet');
        },
        onError: () => toast.error('Kunne ikke oppdatere'),
      }
    );
  };

  return (
    <div className="space-y-3">
      {kittens.map((kitten, index) => (
        <div 
          key={kitten.id} 
          className={`flex items-center gap-4 p-3 rounded-lg border ${
            kitten.complication_type === 'stillborn' || kitten.complication_type === 'deceased'
              ? 'bg-muted/50 opacity-75'
              : 'bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-background border text-sm font-medium shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {kitten.name || `Kattunge ${index + 1}`}
              </span>
              <span className={`text-sm ${getGenderColor(kitten.gender)}`}>
                {getGenderLabel(kitten.gender)}
              </span>
              <KittenComplicationTag 
                value={kitten.complication_type} 
                onChange={editable ? (value) => handleComplicationChange(kitten.id, value) : undefined}
                readOnly={!editable}
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              {kitten.color && <span>{kitten.color}</span>}
              {kitten.birth_weight && (
                <span className="flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {kitten.birth_weight}g
                </span>
              )}
            </div>
          </div>
          {!kitten.complication_type && (
            <Badge variant="secondary" className={STATUS_LABELS[kitten.status || 'available']?.color}>
              {STATUS_LABELS[kitten.status || 'available']?.label}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
