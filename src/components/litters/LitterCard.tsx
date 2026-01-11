import { Link } from 'react-router-dom';
import { Calendar, Heart, Baby } from 'lucide-react';
import { format, addDays, differenceInDays, isBefore } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Litter } from '@/types/litter';
import { Cat } from '@/types';
import { LitterStatusBadge } from './LitterStatusBadge';

interface LitterCardProps {
  litter: Litter;
  cats: Cat[];
}

const GESTATION_DAYS = 65;

const MILESTONES = [
  { day: 21, label: 'Ultralyd mulig', emoji: '🔬' },
  { day: 35, label: 'Mage synlig', emoji: '🤰' },
  { day: 58, label: 'Redeboksperiode', emoji: '📦' },
  { day: 63, label: 'Snart fødsel', emoji: '⏰' },
];

export function LitterCard({ litter, cats }: LitterCardProps) {
  const mother = cats.find(c => c.id === litter.motherId);
  const father = cats.find(c => c.id === litter.fatherId);
  
  const matingStart = litter.matingDateFrom || litter.matingDate;
  const today = new Date();
  
  // Calculate expected date if not set
  const expectedDate = litter.expectedDate 
    ? new Date(litter.expectedDate)
    : matingStart 
      ? addDays(new Date(matingStart), GESTATION_DAYS)
      : null;
  
  // Days pregnant for pending status
  const daysPregnant = matingStart 
    ? differenceInDays(today, new Date(matingStart))
    : null;
  
  // Find next milestone for pending litters
  const getNextMilestone = () => {
    if (litter.status !== 'pending' || !daysPregnant) return null;
    const upcoming = MILESTONES.find(m => m.day > daysPregnant);
    if (!upcoming) return null;
    const daysUntil = upcoming.day - daysPregnant;
    const milestoneDate = matingStart 
      ? addDays(new Date(matingStart), upcoming.day)
      : null;
    return { ...upcoming, daysUntil, date: milestoneDate };
  };
  
  const nextMilestone = getNextMilestone();
  
  const getDisplayDate = () => {
    switch (litter.status) {
      case 'planned':
        return null;
      case 'pending':
        return expectedDate 
          ? `Forventet: ${format(expectedDate, 'd. MMM yyyy', { locale: nb })}`
          : null;
      case 'active':
      case 'completed':
        return litter.birthDate 
          ? `Født: ${format(new Date(litter.birthDate), 'd. MMM yyyy', { locale: nb })}`
          : null;
      default:
        return null;
    }
  };
  
  const displayDate = getDisplayDate();
  
  return (
    <Link
      to={`/litters/${litter.id}`}
      className="block bg-card border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <LitterStatusBadge status={litter.status} />
        {litter.kittenCount && litter.kittenCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Baby className="h-3.5 w-3.5" />
            {litter.kittenCount}
          </span>
        )}
      </div>
      
      {/* Litter name */}
      <h3 className="font-semibold text-lg mb-2 truncate">{litter.name}</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Heart className="h-4 w-4 text-pink-500" />
          <span className="font-medium">
            {mother?.name || 'Ukjent mor'}
          </span>
          <span className="text-muted-foreground">×</span>
          <span className="font-medium">
            {father?.name || litter.externalFatherName || 'Ukjent far'}
          </span>
        </div>
        
        {displayDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {displayDate}
          </div>
        )}
        
        {/* Show pregnancy progress for pending */}
        {litter.status === 'pending' && daysPregnant !== null && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dag {daysPregnant} av {GESTATION_DAYS}</span>
              <span className="text-muted-foreground">{Math.round((daysPregnant / GESTATION_DAYS) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (daysPregnant / GESTATION_DAYS) * 100)}%` }}
              />
            </div>
            {nextMilestone && (
              <div className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5">
                <span>{nextMilestone.emoji}</span>
                <span className="font-medium">{nextMilestone.label}</span>
                <span className="text-muted-foreground ml-auto">
                  om {nextMilestone.daysUntil} dager
                  {nextMilestone.date && (
                    <> ({format(nextMilestone.date, 'd. MMM', { locale: nb })})</>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
        
        {litter.status === 'planned' && litter.inbreedingCoefficient && (
          <p className="text-xs text-muted-foreground">
            Innavl: {litter.inbreedingCoefficient}%
          </p>
        )}
        
        {litter.reasoning && litter.status === 'planned' && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
            {litter.reasoning}
          </p>
        )}
      </div>
    </Link>
  );
}
