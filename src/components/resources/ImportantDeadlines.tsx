import { Calendar, AlertTriangle, Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const deadlines = [
  {
    category: 'Før fødsel',
    items: [
      { week: 'Uke 3-4', task: 'Ultralyd for å bekrefte drektighet', type: 'optional' },
      { week: 'Uke 6-7', task: 'Røntgen for å telle kattunger', type: 'optional' },
      { week: 'Uke 7', task: 'Fødekasse klar', type: 'required' },
      { week: 'Uke 8', task: 'Alt fødselsutstyr klart', type: 'required' },
      { week: 'Dag 60', task: 'Start tett overvåkning', type: 'required' },
    ],
  },
  {
    category: 'Etter fødsel',
    items: [
      { week: 'Dag 1', task: 'Veiing og registrering av alle kattunger', type: 'required' },
      { week: 'Uke 1-8', task: 'Daglig veiing av kattunger', type: 'required' },
      { week: 'Uke 3', task: 'Første ormebehandling', type: 'required' },
      { week: 'Uke 5', task: 'Andre ormebehandling', type: 'required' },
      { week: 'Uke 7', task: 'Tredje ormebehandling', type: 'required' },
    ],
  },
  {
    category: 'Vaksinasjon & ID',
    items: [
      { week: 'Uke 8-9', task: 'Veterinærsjekk og helseundersøkelse', type: 'required' },
      { week: 'Uke 10-11', task: 'Første vaksine (P, C, R)', type: 'required' },
      { week: 'Uke 10-12', task: 'ID-merking (mikrochip)', type: 'required' },
      { week: 'Uke 13-15', task: 'Andre vaksine (3-4 uker etter første)', type: 'required' },
      { week: 'Ved behov', task: 'Rabiesvaksine (ved utenlandsreise)', type: 'optional' },
    ],
  },
  {
    category: 'Registrering (NRR)',
    items: [
      { week: 'Innen 8 uker', task: 'Registrere kullet hos NRR', type: 'deadline' },
      { week: 'Før levering', task: 'Stamtavler bestilt/mottatt', type: 'required' },
      { week: 'Ved overlevering', task: 'Eierskifte registrert', type: 'required' },
    ],
  },
  {
    category: 'Før levering',
    items: [
      { week: 'Uke 12+', task: 'Fullvaksinert (1-2 uker etter 2. vaksine)', type: 'required' },
      { week: 'Før levering', task: 'Ormebehandling 1 uke før', type: 'required' },
      { week: 'Før levering', task: 'Kjøpekontrakt signert', type: 'required' },
      { week: 'Ved levering', task: 'Helseattest fra veterinær', type: 'optional' },
      { week: 'Ved levering', task: 'Vaksinasjonskort, stamtavle, fôrprøve', type: 'required' },
    ],
  },
];

const typeStyles = {
  required: { label: 'Påkrevd', variant: 'default' as const, icon: Check },
  optional: { label: 'Anbefalt', variant: 'secondary' as const, icon: Clock },
  deadline: { label: 'Frist', variant: 'destructive' as const, icon: AlertTriangle },
};

export function ImportantDeadlines() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Oversikt over viktige milepæler og frister fra drektighet til levering.
      </p>

      {deadlines.map(category => (
        <div key={category.category} className="space-y-3">
          <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {category.category}
          </h3>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {category.items.map((item, i) => {
                  const style = typeStyles[item.type];
                  const Icon = style.icon;
                  return (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="p-3 w-24 text-muted-foreground whitespace-nowrap">
                        {item.week}
                      </td>
                      <td className="p-3">{item.task}</td>
                      <td className="p-3 text-right">
                        <Badge variant={style.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{style.label}</span>
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Viktig om NRR-registrering
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Kullet må registreres innen 8 uker for å unngå ekstragebyr</li>
          <li>• Begge foreldres stamtavler må være registrert</li>
          <li>• Husk å registrere parringsmelding før fødsel</li>
          <li>• Alle kattunger må ID-merkes før de kan registreres</li>
        </ul>
      </div>
    </div>
  );
}
