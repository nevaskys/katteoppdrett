import { Badge } from '@/components/ui/badge';

interface StructuredResult {
  type?: string;
  head?: string;
  eyes?: string;
  ears?: string;
  coat?: string;
  tail?: string;
  condition?: string;
  general?: string;
  result?: string;
  judgeName?: string;
  [key: string]: string | undefined;
}

interface StructuredJudgingDisplayProps {
  structuredResult: Record<string, unknown>;
}

// Norske labels for visning
const labelMap: Record<string, string> = {
  type: 'Type',
  head: 'Hode/Head',
  eyes: 'Øyne/Eyes',
  ears: 'Ører/Ears',
  coat: 'Pels/Coat',
  tail: 'Hale/Tail',
  condition: 'Kondisjon',
  general: 'Totalinntrykk',
  result: 'Resultat',
  judgeName: 'Dommer',
};

// Rekkefølge for visning - matcher dommerseddelen
const orderedKeys = ['type', 'head', 'eyes', 'ears', 'coat', 'tail', 'condition', 'general', 'result', 'judgeName'];

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
    <div className="space-y-2">
      {allKeys.map(key => {
        const value = result[key];
        if (!value || typeof value !== 'string') return null;
        
        const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        
        return (
          <div key={key} className="flex flex-col">
            <span className="font-semibold text-foreground">{label}:</span>
            <span className="text-muted-foreground">"{value}"</span>
          </div>
        );
      })}
    </div>
  );
}
