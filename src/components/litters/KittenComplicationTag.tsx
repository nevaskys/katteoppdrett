import { AlertTriangle, Skull, HeartOff, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ComplicationType = 'stillborn' | 'deceased' | 'complications' | null;

interface KittenComplicationTagProps {
  value: ComplicationType;
  onChange?: (value: ComplicationType) => void;
  readOnly?: boolean;
}

export const COMPLICATION_CONFIG: Record<Exclude<ComplicationType, null>, {
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  description: string;
}> = {
  stillborn: {
    label: 'Dødfødt',
    icon: Skull,
    color: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300',
    description: 'Født død',
  },
  deceased: {
    label: 'Død',
    icon: HeartOff,
    color: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300',
    description: 'Døde etter fødsel',
  },
  complications: {
    label: 'Komplikasjoner',
    icon: AlertTriangle,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    description: 'Hadde komplikasjoner',
  },
};

export function KittenComplicationTag({ value, onChange, readOnly }: KittenComplicationTagProps) {
  if (!value && readOnly) {
    return null;
  }

  if (!value && !readOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Legg til tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(COMPLICATION_CONFIG) as Exclude<ComplicationType, null>[]).map(type => {
            const config = COMPLICATION_CONFIG[type];
            return (
              <DropdownMenuItem key={type} onClick={() => onChange?.(type)}>
                <config.icon className="h-4 w-4 mr-2" />
                {config.label}
                <span className="text-xs text-muted-foreground ml-2">– {config.description}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const config = COMPLICATION_CONFIG[value!];
  const Icon = config.icon;

  if (readOnly) {
    return (
      <Badge variant="secondary" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Badge variant="secondary" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={() => onChange?.(null)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
