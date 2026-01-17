import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const vaccines = [
  {
    name: 'Kattepest (Panleukopeni)',
    abbreviation: 'P',
    description: 'Svært smittsom virussykdom som angriper tarmene og immunsystemet.',
    schedule: 'Grunnvaksinasjon: 2 doser med 3-4 ukers mellomrom. Revaksinering: hvert 1-3 år.',
    required: true,
  },
  {
    name: 'Kattesnue (Calicivirus)',
    abbreviation: 'C',
    description: 'Luftveisvirus som gir symptomer som nysing, rennende øyne og munnår.',
    schedule: 'Grunnvaksinasjon: 2 doser med 3-4 ukers mellomrom. Revaksinering: årlig.',
    required: true,
  },
  {
    name: 'Kattesnue (Herpesvirus)',
    abbreviation: 'R',
    description: 'Luftveisvirus som gir feber, nysing og øyeinfeksjoner. Kan bli kronisk bærer.',
    schedule: 'Grunnvaksinasjon: 2 doser med 3-4 ukers mellomrom. Revaksinering: årlig.',
    required: true,
  },
  {
    name: 'Rabies',
    abbreviation: 'Rabies',
    description: 'Dødelig virussykdom. Påkrevd ved reise til/fra Norge.',
    schedule: 'Fra 12 ukers alder. Revaksinering etter produsentens anvisning (1-3 år).',
    required: false,
    note: 'Kun nødvendig ved utenlandsreise',
  },
  {
    name: 'Klamydia',
    abbreviation: 'Chl',
    description: 'Bakterieinfeksjon som hovedsakelig gir øyeinfeksjon (konjunktivitt).',
    schedule: 'Fra 9 ukers alder. 2 doser med 3-4 ukers mellomrom.',
    required: false,
    note: 'Anbefales i oppdrett og flerkattshushold',
  },
  {
    name: 'FeLV (Katteleukemi)',
    abbreviation: 'FeLV',
    description: 'Retrovirus som svekker immunforsvaret og kan føre til kreft.',
    schedule: 'Fra 8-9 ukers alder. 2 doser med 3-4 ukers mellomrom. Årlig revaksinering.',
    required: false,
    note: 'Anbefales for utekatter. Test for FeLV før vaksinering.',
  },
];

export function VaccineOverview() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Kjernevaksiner (P, C, R) anbefales for alle katter. Andre vaksiner vurderes basert på 
          livsstil og risiko. Snakk alltid med din veterinær om vaksinasjonsplan.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Kjerne</span>
          Kjernevaksiner
        </h3>
        
        {vaccines.filter(v => v.required).map(vaccine => (
          <div key={vaccine.abbreviation} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{vaccine.name}</h4>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{vaccine.abbreviation}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{vaccine.description}</p>
            <p className="text-sm"><strong>Vaksinering:</strong> {vaccine.schedule}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">Valgfri</span>
          Ikke-kjernevaksiner
        </h3>
        
        {vaccines.filter(v => !v.required).map(vaccine => (
          <div key={vaccine.abbreviation} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{vaccine.name}</h4>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{vaccine.abbreviation}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{vaccine.description}</p>
            <p className="text-sm"><strong>Vaksinering:</strong> {vaccine.schedule}</p>
            {vaccine.note && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {vaccine.note}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium">Typisk vaksinasjonsplan for kattunger</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li><strong>8-9 uker:</strong> Første dose (P, C, R)</li>
          <li><strong>12 uker:</strong> Andre dose (P, C, R) + evt. rabies ved reise</li>
          <li><strong>1 år:</strong> Revaksinering</li>
          <li><strong>Deretter:</strong> Årlig eller hvert 3. år avhengig av vaksine</li>
        </ul>
      </div>
    </div>
  );
}
