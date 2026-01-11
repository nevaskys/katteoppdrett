import { Link } from 'react-router-dom';
import { Calendar, Heart, Baby } from 'lucide-react';
import { Litter } from '@/types/litter';
import { Cat } from '@/types';
import { LitterStatusBadge } from './LitterStatusBadge';

interface LitterCardProps {
  litter: Litter;
  cats: Cat[];
}

export function LitterCard({ litter, cats }: LitterCardProps) {
  const mother = cats.find(c => c.id === litter.motherId);
  const father = cats.find(c => c.id === litter.fatherId);
  
  const getDisplayDate = () => {
    const matingStart = litter.matingDateFrom || litter.matingDate;
    
    switch (litter.status) {
      case 'planned':
        return null;
      case 'pending':
        return litter.expectedDate 
          ? `Forventet: ${new Date(litter.expectedDate).toLocaleDateString('nb-NO')}`
          : matingStart 
            ? `Parring: ${new Date(matingStart).toLocaleDateString('nb-NO')}`
            : null;
      case 'active':
      case 'completed':
        return litter.birthDate 
          ? `Født: ${new Date(litter.birthDate).toLocaleDateString('nb-NO')}`
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
      <div className="flex items-start justify-between gap-2 mb-3">
        <LitterStatusBadge status={litter.status} />
        {litter.kittenCount && litter.kittenCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Baby className="h-3.5 w-3.5" />
            {litter.kittenCount}
          </span>
        )}
      </div>
      
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
