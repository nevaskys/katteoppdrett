import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Litter, LitterStatus, LITTER_STATUS_CONFIG } from '@/types/litter';
import { Cat } from '@/types';
import { LitterCard } from './LitterCard';
import { cn } from '@/lib/utils';

interface LitterStatusSectionProps {
  status: LitterStatus;
  litters: Litter[];
  cats: Cat[];
  defaultExpanded?: boolean;
}

export function LitterStatusSection({ 
  status, 
  litters, 
  cats, 
  defaultExpanded = true 
}: LitterStatusSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = LITTER_STATUS_CONFIG[status];
  
  if (litters.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 text-left group"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
          {config.label}
        </h2>
        <span className="text-sm text-muted-foreground">
          ({litters.length})
        </span>
      </button>
      
      {isExpanded && (
        <div className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-7"
        )}>
          {litters.map(litter => (
            <LitterCard key={litter.id} litter={litter} cats={cats} />
          ))}
        </div>
      )}
    </div>
  );
}
