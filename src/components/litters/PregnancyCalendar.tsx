import { differenceInDays, addDays, format, isToday, isBefore, isAfter } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Baby, Heart, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PregnancyCalendarProps {
  matingDateFrom: string;
  matingDateTo?: string | null;
  expectedDate?: string | null;
  birthDate?: string | null;
}

const GESTATION_DAYS = 65;

export function PregnancyCalendar({ 
  matingDateFrom, 
  matingDateTo, 
  expectedDate,
  birthDate 
}: PregnancyCalendarProps) {
  // Parse dates at midnight to avoid timezone issues
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  const startDate = parseDate(matingDateFrom);
  const endDate = matingDateTo ? parseDate(matingDateTo) : startDate;
  
  // Get today at midnight for consistent calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate based on first mating date for expected delivery
  const calculatedExpectedDate = addDays(startDate, GESTATION_DAYS);
  const displayExpectedDate = expectedDate ? parseDate(expectedDate) : calculatedExpectedDate;
  
  // Calculate days pregnant (from first mating)
  const daysPregnant = differenceInDays(today, startDate);
  // Days until birth - from today to expected date
  const daysUntilBirth = differenceInDays(displayExpectedDate, today);
  
  // If already born, show that instead
  if (birthDate) {
    const birthDateObj = new Date(birthDate);
    const actualGestationDays = differenceInDays(birthDateObj, startDate);
    
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <Baby className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">Kattungene er født! 🎉</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {format(birthDateObj, 'd. MMMM yyyy', { locale: nb })}
            </p>
          </div>
        </div>
        <p className="text-sm text-green-600 dark:text-green-400">
          Drektigheten varte i {actualGestationDays} dager
        </p>
      </div>
    );
  }
  
  // Show progress
  const progressPercentage = Math.min(100, Math.max(0, (daysPregnant / GESTATION_DAYS) * 100));
  
  // Generate week markers
  const weeks = [];
  for (let i = 1; i <= 9; i++) {
    const weekDay = i * 7;
    const weekDate = addDays(startDate, weekDay);
    const isPast = isBefore(weekDate, today);
    const isCurrent = daysPregnant >= (i - 1) * 7 && daysPregnant < i * 7;
    weeks.push({ week: i, day: weekDay, date: weekDate, isPast, isCurrent });
  }
  
  // Key milestones
  const milestones = [
    { day: 21, label: 'Ultralyd mulig', emoji: '🔬' },
    { day: 35, label: 'Mage synlig', emoji: '🤰' },
    { day: 58, label: 'Redeboksperiode', emoji: '📦' },
    { day: 63, label: 'Snart fødsel', emoji: '⏰' },
  ];
  
  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200 dark:border-pink-800 rounded-xl p-6 space-y-6">
      {/* Header with current status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full animate-pulse">
            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              Dag {daysPregnant} av ~{GESTATION_DAYS}
            </h3>
            <p className="text-sm text-pink-700 dark:text-pink-300">
              {daysUntilBirth > 0 
                ? `${daysUntilBirth} dager til forventet fødsel`
                : daysUntilBirth === 0 
                  ? 'Forventet fødsel i dag! 🎉'
                  : `${Math.abs(daysUntilBirth)} dager over termin`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Forventet fødsel</p>
          <p className="font-medium text-pink-900 dark:text-pink-100">
            {format(displayExpectedDate, 'd. MMM', { locale: nb })}
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-4 bg-pink-100 dark:bg-pink-900/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-500 relative"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Parring</span>
          <span>Fødsel</span>
        </div>
      </div>
      
      {/* Week indicators */}
      <div className="grid grid-cols-9 gap-1">
        {weeks.map(({ week, isPast, isCurrent }) => (
          <div 
            key={week}
            className={cn(
              "text-center py-2 rounded-lg text-xs font-medium transition-all",
              isCurrent && "bg-pink-500 text-white scale-110 shadow-md",
              isPast && !isCurrent && "bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300",
              !isPast && !isCurrent && "bg-pink-100/50 dark:bg-pink-900/30 text-pink-400 dark:text-pink-600"
            )}
          >
            <div className="text-[10px] opacity-75">Uke</div>
            <div>{week}</div>
          </div>
        ))}
      </div>
      
      {/* Milestones */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Milepæler</p>
        <div className="grid grid-cols-2 gap-2">
          {milestones.map(({ day, label, emoji }) => {
            const isPast = daysPregnant >= day;
            const isUpcoming = daysPregnant >= day - 7 && daysPregnant < day;
            
            return (
              <div 
                key={day}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-sm transition-all",
                  isPast && "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
                  isUpcoming && "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-300",
                  !isPast && !isUpcoming && "bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="text-lg">{emoji}</span>
                <div>
                  <p className="font-medium text-xs">{label}</p>
                  <p className="text-[10px] opacity-75">Dag {day}</p>
                </div>
                {isPast && <span className="ml-auto text-green-500">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Mating dates info */}
      <div className="pt-4 border-t border-pink-200 dark:border-pink-800">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Parring: {format(startDate, 'd. MMM', { locale: nb })}
            {matingDateTo && matingDateTo !== matingDateFrom && (
              <> – {format(endDate, 'd. MMM', { locale: nb })}</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate expected date
export function calculateExpectedDate(matingDateFrom: string): string {
  const date = addDays(new Date(matingDateFrom), GESTATION_DAYS);
  return format(date, 'yyyy-MM-dd');
}
