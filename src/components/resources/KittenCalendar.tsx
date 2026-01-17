import { Baby, Eye, Ear, Footprints, Utensils, Syringe, Heart, Home } from 'lucide-react';

const milestones = [
  {
    week: '0-1',
    title: 'Nyfødt',
    icon: Baby,
    items: [
      'Veier 90-120g ved fødsel',
      'Øyne og ører lukket',
      'Helt avhengig av mor',
      'Sover 90% av tiden',
      'Daglig veiing viktig',
      'Bør øke 8-10g per dag',
    ],
    color: 'text-pink-500',
  },
  {
    week: '1-2',
    title: 'Første uke',
    icon: Eye,
    items: [
      'Øynene begynner å åpne (dag 7-14)',
      'Navlestrengen faller av',
      'Fortsatt daglig veiing',
      'Bør doble fødselsvekten innen 2 uker',
    ],
    color: 'text-purple-500',
  },
  {
    week: '2-3',
    title: 'Øyne og ører åpnes',
    icon: Ear,
    items: [
      'Øynene helt åpne (alle har blå øyne)',
      'Øregangene åpner seg',
      'Begynner å reagere på lyd',
      'Første tenner kan komme',
    ],
    color: 'text-blue-500',
  },
  {
    week: '3-4',
    title: 'Første skritt',
    icon: Footprints,
    items: [
      'Begynner å gå ustøtt',
      'Kan regulere egen kroppstemperatur bedre',
      'Begynner lekeadferd',
      'Introduser kattedo',
    ],
    color: 'text-cyan-500',
  },
  {
    week: '4-5',
    title: 'Fast føde introduseres',
    icon: Utensils,
    items: [
      'Kan begynne med våtfôr/grøt',
      'Melketenner kommer',
      'Mer aktive og lekne',
      'Begynner å vaske seg selv',
      'Sosialisering starter for alvor',
    ],
    color: 'text-green-500',
  },
  {
    week: '5-6',
    title: 'Aktiv avvenning',
    icon: Utensils,
    items: [
      'Spiser mer fast føde',
      'Mindre avhengig av morsmelk',
      'Løper og klatrer',
      'Leker med søsken',
    ],
    color: 'text-lime-500',
  },
  {
    week: '6-8',
    title: 'Sosialisering',
    icon: Heart,
    items: [
      'Kritisk sosialiseringsperiode',
      'Introduser forskjellige lyder, mennesker, miljøer',
      'Mest avvent fra mor',
      'Kan begynne å vise personlighet',
      'Første veterinærsjekk/ormebehandling',
    ],
    color: 'text-amber-500',
  },
  {
    week: '10-11',
    title: 'Første vaksine',
    icon: Syringe,
    items: [
      'Første vaksinedose (P, C, R)',
      'Fullstendig avvent',
      'Spiser kun fast føde',
      'Klar for ID-merking (chip)',
    ],
    color: 'text-orange-500',
  },
  {
    week: '13-14',
    title: 'Andre vaksine',
    icon: Syringe,
    items: [
      'Andre vaksinedose (3-4 uker etter første)',
      'Full beskyttelse 1-2 uker etter',
      'Evt. rabiesvaksine hvis reise',
    ],
    color: 'text-red-500',
  },
  {
    week: '12-16',
    title: 'Klar for nytt hjem',
    icon: Home,
    items: [
      'Fullvaksinert og ID-merket',
      'Godt sosialisert',
      'Spiser selvstendig',
      'Bruker kattedo pålitelig',
      'NRR-registrering fullført',
      'Kjøpekontrakt og dokumenter klare',
    ],
    color: 'text-emerald-500',
  },
];

export function KittenCalendar() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Viktige milepæler i kattungens utvikling fra fødsel til levering.
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            return (
              <div key={index} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-2 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center ${milestone.color} border-current`}>
                  <Icon className="h-3 w-3" />
                </div>

                <div className="border rounded-lg p-4 space-y-2 bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{milestone.title}</h4>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      Uke {milestone.week}
                    </span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {milestone.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
