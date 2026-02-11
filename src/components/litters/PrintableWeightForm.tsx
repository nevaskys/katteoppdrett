import { useState } from 'react';
import { Printer, Cat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useKittensByLitter } from '@/hooks/useKittens';

interface PrintableWeightFormProps {
  litterId: string;
  birthDate?: string | null;
}

export function PrintableWeightForm({ litterId, birthDate }: PrintableWeightFormProps) {
  const [open, setOpen] = useState(false);
  const { data: kittens = [] } = useKittensByLitter(litterId);

  if (!birthDate) return null;

  const birthDateObj = new Date(birthDate);
  const totalDays = 28; // 4 weeks
  const measurementsPerDay = 4;

  const days = Array.from({ length: totalDays + 1 }, (_, i) => {
    const date = addDays(birthDateObj, i);
    return {
      dayNumber: i,
      date,
      dateStr: format(date, 'd.MM', { locale: nb }),
      weekday: format(date, 'EEE', { locale: nb }),
    };
  });

  const kittenNames = kittens.length > 0
    ? kittens.map(k => k.name || k.color || `Kattunge ${kittens.indexOf(k) + 1}`)
    : ['Kattunge 1', 'Kattunge 2', 'Kattunge 3', 'Kattunge 4'];

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const colCount = kittenNames.length * measurementsPerDay;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vektskjema - Født ${format(birthDateObj, 'd. MMMM yyyy', { locale: nb })}</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9px; }
          h1 { font-size: 14px; margin-bottom: 4px; }
          .info { font-size: 10px; margin-bottom: 8px; color: #555; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #999; padding: 2px 3px; text-align: center; }
          th { background: #f0f0f0; font-size: 8px; }
          .day-header { background: #e8e8e8; font-weight: bold; text-align: left; padding-left: 6px; }
          .kitten-group { border-left: 2px solid #333; }
          .kitten-name { font-size: 10px; font-weight: bold; }
          td.cell { height: 18px; min-width: 22px; }
          .time-labels { font-size: 7px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Vektskjema (gram)</h1>
        <p class="info">Fødselsdato: ${format(birthDateObj, 'd. MMMM yyyy', { locale: nb })} | Periode: Dag 0–${totalDays} (4 uker)</p>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 55px;">Dag</th>
              <th rowspan="2" style="width: 45px;">Dato</th>
              ${kittenNames.map((name, i) => `<th colspan="${measurementsPerDay}" class="${i > 0 ? 'kitten-group' : ''}"><span class="kitten-name">${name}</span></th>`).join('')}
            </tr>
            <tr>
              ${kittenNames.map((_, i) => 
                Array.from({ length: measurementsPerDay }, (_, j) => 
                  `<th class="${j === 0 && i > 0 ? 'kitten-group' : ''} time-labels">${j === 0 ? 'Morg' : j === 1 ? 'Midd' : j === 2 ? 'Kveld' : 'Natt'}</th>`
                ).join('')
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${days.map(day => `
              <tr>
                <td class="day-header">Dag ${day.dayNumber} (${day.weekday})</td>
                <td>${day.dateStr}</td>
                ${kittenNames.map((_, i) => 
                  Array.from({ length: measurementsPerDay }, (_, j) => 
                    `<td class="cell ${j === 0 && i > 0 ? 'kitten-group' : ''}"></td>`
                  ).join('')
                ).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="h-4 w-4 mr-2" />
      Skriv ut vektskjema
    </Button>
  );
}
