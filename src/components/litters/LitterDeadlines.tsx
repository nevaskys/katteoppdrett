import { Calendar, Check, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, addDays, addWeeks, differenceInDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DeadlineItem {
  id: string;
  daysAfterBirth: number; // negative for before birth
  task: string;
  type: 'required' | 'optional' | 'deadline';
  category: string;
}

// Define deadlines with days relative to birth (0 = birth day)
const deadlineDefinitions: DeadlineItem[] = [
  // Etter fødsel
  { id: 'weighing-day1', daysAfterBirth: 0, task: 'Veiing og registrering av alle kattunger', type: 'required', category: 'Etter fødsel' },
  { id: 'daily-weighing', daysAfterBirth: 1, task: 'Start daglig veiing av kattunger (uke 1-8)', type: 'required', category: 'Etter fødsel' },
  { id: 'deworming-consider', daysAfterBirth: 21, task: 'Vurder ormebehandling – rådfør deg med veterinær om du er usikker', type: 'optional', category: 'Etter fødsel' },
  
  // Vaksinasjon & ID
  { id: 'vet-check', daysAfterBirth: 56, task: 'Veterinærsjekk og helseundersøkelse (uke 8-9)', type: 'required', category: 'Vaksinasjon & ID' },
  { id: 'first-vaccine', daysAfterBirth: 70, task: 'Første vaksine (P, C, R) – uke 10-11', type: 'required', category: 'Vaksinasjon & ID' },
  { id: 'microchip', daysAfterBirth: 77, task: 'ID-merking (mikrochip) – uke 10-12', type: 'required', category: 'Vaksinasjon & ID' },
  { id: 'second-vaccine', daysAfterBirth: 98, task: 'Andre vaksine (3-4 uker etter første) – uke 13-15', type: 'required', category: 'Vaksinasjon & ID' },
  
  // Registrering (NRR)
  { id: 'nrr-registration', daysAfterBirth: 56, task: 'Registrere kullet hos NRR', type: 'deadline', category: 'Registrering (NRR)' },
  { id: 'pedigrees', daysAfterBirth: 84, task: 'Stamtavler bestilt/mottatt', type: 'required', category: 'Registrering (NRR)' },
  
  // Før levering
  { id: 'fully-vaccinated', daysAfterBirth: 105, task: 'Fullvaksinert (1-2 uker etter 2. vaksine)', type: 'required', category: 'Før levering' },
  { id: 'deworming-pre-delivery', daysAfterBirth: 98, task: 'Vurder ormebehandling – rådfør deg med veterinær', type: 'optional', category: 'Før levering' },
  { id: 'contract', daysAfterBirth: 84, task: 'Kjøpekontrakt signert', type: 'required', category: 'Før levering' },
  { id: 'health-cert', daysAfterBirth: 105, task: 'Helseattest fra veterinær (valgfritt)', type: 'optional', category: 'Før levering' },
  { id: 'delivery-docs', daysAfterBirth: 105, task: 'Vaksinasjonskort, stamtavle, fôrprøve klart', type: 'required', category: 'Før levering' },
];

interface LitterDeadlinesProps {
  birthDate: string;
  compact?: boolean;
}

export function LitterDeadlines({ birthDate, compact = false }: LitterDeadlinesProps) {
  const birthDateObj = startOfDay(new Date(birthDate));
  const today = startOfDay(new Date());
  const daysOld = differenceInDays(today, birthDateObj);
  
  // Group deadlines by category
  const categories = [...new Set(deadlineDefinitions.map(d => d.category))];
  
  const getDeadlineStatus = (daysAfterBirth: number): 'done' | 'current' | 'upcoming' => {
    const targetDate = addDays(birthDateObj, daysAfterBirth);
    const daysDiff = differenceInDays(targetDate, today);
    
    if (daysDiff < -3) return 'done'; // Past by more than 3 days
    if (daysDiff <= 7) return 'current'; // Within next 7 days or slightly past
    return 'upcoming';
  };
  
  const getStatusStyles = (status: 'done' | 'current' | 'upcoming') => {
    switch (status) {
      case 'done':
        return 'bg-muted/50 text-muted-foreground';
      case 'current':
        return 'bg-primary/10 border-primary/30';
      case 'upcoming':
        return '';
    }
  };

  if (compact) {
    // Show only upcoming/current deadlines
    const upcomingDeadlines = deadlineDefinitions
      .filter(d => getDeadlineStatus(d.daysAfterBirth) !== 'done')
      .slice(0, 5);
    
    if (upcomingDeadlines.length === 0) {
      return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          Alle frister passert
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {upcomingDeadlines.map(deadline => {
          const targetDate = addDays(birthDateObj, deadline.daysAfterBirth);
          const status = getDeadlineStatus(deadline.daysAfterBirth);
          const daysDiff = differenceInDays(targetDate, today);
          
          return (
            <div 
              key={deadline.id}
              className={`flex items-center gap-3 text-sm p-2 rounded-md border ${getStatusStyles(status)}`}
            >
              {status === 'current' ? (
                <Clock className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate">{deadline.task}</p>
              </div>
              <span className={`text-xs whitespace-nowrap ${status === 'current' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {daysDiff === 0 ? 'I dag' : daysDiff === 1 ? 'I morgen' : daysDiff < 0 ? `${Math.abs(daysDiff)}d siden` : `om ${daysDiff}d`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Kattungene er {daysOld} dager ({Math.floor(daysOld / 7)} uker) gamle. Datoer beregnet fra fødselsdato.
        </p>
      </div>

      {categories.map(category => {
        const categoryDeadlines = deadlineDefinitions.filter(d => d.category === category);
        
        return (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {category}
            </h3>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {categoryDeadlines.map((deadline) => {
                    const targetDate = addDays(birthDateObj, deadline.daysAfterBirth);
                    const status = getDeadlineStatus(deadline.daysAfterBirth);
                    const daysDiff = differenceInDays(targetDate, today);
                    
                    return (
                      <tr 
                        key={deadline.id} 
                        className={`border-b last:border-b-0 ${getStatusStyles(status)}`}
                      >
                        <td className="p-3 w-28 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {status === 'done' && <Check className="h-3 w-3 text-green-600" />}
                            {status === 'current' && <Clock className="h-3 w-3 text-primary" />}
                            <span className={status === 'current' ? 'font-medium' : ''}>
                              {format(targetDate, 'd. MMM', { locale: nb })}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">{deadline.task}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {deadline.type === 'deadline' && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="hidden sm:inline">Frist</span>
                            </Badge>
                          )}
                          {status === 'current' && deadline.type !== 'deadline' && (
                            <span className="text-xs text-primary font-medium">
                              {daysDiff === 0 ? 'I dag' : daysDiff === 1 ? 'I morgen' : daysDiff < 0 ? `${Math.abs(daysDiff)}d siden` : `${daysDiff}d`}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
