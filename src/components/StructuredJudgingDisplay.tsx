import { Badge } from '@/components/ui/badge';

interface StructuredResult {
  head?: string;
  ears?: string;
  eyes?: string;
  body?: string;
  legs_feet?: string;
  tail?: string;
  coat?: string;
  color?: string;
  condition?: string;
  general?: string;
  [key: string]: string | undefined;
}

interface StructuredJudgingDisplayProps {
  structuredResult: Record<string, unknown>;
}

const labelMap: Record<string, string> = {
  head: 'Hode',
  ears: 'Ører',
  eyes: 'Øyne',
  body: 'Kropp',
  legs_feet: 'Ben/Føtter',
  tail: 'Hale',
  coat: 'Pels',
  color: 'Farge',
  condition: 'Kondisjon',
  general: 'Generelt',
};

const orderedKeys = ['head', 'ears', 'eyes', 'body', 'legs_feet', 'tail', 'coat', 'color', 'condition', 'general'];

export function StructuredJudgingDisplay({ structuredResult }: StructuredJudgingDisplayProps) {
  const result = structuredResult as StructuredResult;
  
  // Get ordered keys that have values
  const keysWithValues = orderedKeys.filter(key => result[key]);
  
  // Get any additional keys not in our ordered list
  const additionalKeys = Object.keys(result).filter(
    key => !orderedKeys.includes(key) && result[key] && typeof result[key] === 'string'
  );
  
  const allKeys = [...keysWithValues, ...additionalKeys];
  
  if (allKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">Ingen strukturert data</p>;
  }

  return (
    <div className="space-y-3">
      {allKeys.map(key => {
        const value = result[key];
        if (!value || typeof value !== 'string') return null;
        
        const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        
        return (
          <div key={key} className="border-l-2 border-primary/30 pl-3">
            <Badge variant="secondary" className="mb-1 text-xs font-medium">
              {label}
            </Badge>
            <p className="text-sm leading-relaxed">{value}</p>
          </div>
        );
      })}
    </div>
  );
}
