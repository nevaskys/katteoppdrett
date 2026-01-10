import { LitterStatus, LITTER_STATUS_CONFIG } from '@/types/litter';
import { cn } from '@/lib/utils';

interface LitterStatusBadgeProps {
  status: LitterStatus;
  className?: string;
}

export function LitterStatusBadge({ status, className }: LitterStatusBadgeProps) {
  const config = LITTER_STATUS_CONFIG[status];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.color,
      className
    )}>
      {config.label}
    </span>
  );
}
