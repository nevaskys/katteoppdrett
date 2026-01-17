import { useState, useRef } from 'react';
import { 
  Baby, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  Heart, 
  Thermometer,
  Phone,
  Printer,
  FileText,
  ChevronDown,
  ChevronUp,
  Scale,
  Clock,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface BirthGuideProps {
  notes?: string;
  onNotesChange?: (notes: string) => void;
  checklist?: Record<string, boolean>;
  onChecklistChange?: (checklist: Record<string, boolean>) => void;
  vetPhone?: string;
  onVetPhoneChange?: (phone: string) => void;
}

export function BirthGuide({ 
  notes = '', 
  onNotesChange,
  checklist = {},
  onChecklistChange,
  vetPhone = '',
  onVetPhoneChange
}: BirthGuideProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    preparation: true,
    signs: false,
    phases: false,
    afterBirth: false,
    postBirth: false,
    weight: false,
    challenges: false,
    emergency: false,
    notes: false,
  });
  const printRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChecklistToggle = (key: string) => {
    if (onChecklistChange) {
      onChecklistChange({ ...checklist, [key]: !checklist[key] });
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Fødselsguide - Katt</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 20px; 
              max-width: 800px; 
              margin: 0 auto;
              line-height: 1.6;
            }
            h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #333; }
            h3 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
            ul { padding-left: 20px; margin: 8px 0; }
            li { margin: 4px 0; }
            .section { margin-bottom: 20px; page-break-inside: avoid; }
            .alert { background: #fff3cd; padding: 12px; border-radius: 4px; margin: 12px 0; border-left: 4px solid #ffc107; }
            .emergency { background: #f8d7da; padding: 12px; border-radius: 4px; margin: 12px 0; border-left: 4px solid #dc3545; }
            .notes-section { background: #f8f9fa; padding: 16px; border-radius: 4px; margin-top: 20px; }
            .checklist-item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
            .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; }
            .checkbox.checked::after { content: '✓'; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>🐾 Fødselsguide – Katt</h1>
          
          <div class="section">
            <h2>1. Før fødsel (forberedelser)</h2>
            <h3>📅 Tidslinje</h3>
            <ul>
              <li>Normal drektighet: 63–70 dager</li>
              <li>Start tett overvåkning: dag 60</li>
              <li>Fødekasse klar senest uke 7</li>
            </ul>
            
            <h3>🧺 Fødekasse</h3>
            <ul>
              <li>Rolig, lunt, trekkfritt sted</li>
              <li>Romtemperatur ca. 23°C</li>
              <li>Høye nok kanter slik at mor føler seg trygg</li>
              <li>Flere lag engangsunderlag/håndklær/fleece</li>
            </ul>
            
            <h3>🧰 Utstyr (sjekkliste)</h3>
            <ul>
              <li>☐ Engangsunderlag</li>
              <li>☐ Rene håndklær</li>
              <li>☐ Saks (renset)</li>
              <li>☐ Bomull / papir</li>
              <li>☐ Kjøkkenvekt (gram)</li>
              <li>☐ Desinfeksjon (mild)</li>
              <li>☐ Termometer</li>
              <li>☐ Notatark / logg</li>
              <li>☐ Morsmelkerstatning + 1 ml sprøyte</li>
              <li>☐ Veterinærens telefonnummer</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>2. Tegn på at fødselen nærmer seg</h2>
            <ul>
              <li>Rastløs, graver/reder</li>
              <li>Mindre matlyst</li>
              <li>Fall i kroppstemperatur (ofte < 37,8°C)</li>
              <li>Melk i jur</li>
              <li>Slim / klar utflod</li>
              <li>Trekker seg unna</li>
            </ul>
            <p><em>👉 Dette kan vare fra timer til 1–2 døgn</em></p>
          </div>
          
          <div class="section">
            <h2>3. Fødselens faser</h2>
            <h3>🔹 Åpningsfase</h3>
            <ul>
              <li>Uro, pesing, hyppige stillingsbytter</li>
              <li>Ingen pressveer</li>
              <li>Kan vare 6–24 timer</li>
            </ul>
            
            <h3>🔹 Utdrivningsfase</h3>
            <ul>
              <li>Synlige rier</li>
              <li>Kattunge fødes ca. hver 15–60 min</li>
              <li>Pauser er normalt</li>
            </ul>
            
            <h3>🔹 Etterbyrdsfase</h3>
            <ul>
              <li>Morkaken følger hver kattunge</li>
              <li>Antall morkaker = antall kattunger</li>
            </ul>
            
            <div class="emergency">
              <strong>⚠️ Kontakt veterinær hvis:</strong>
              <ul>
                <li>Kraftige rier > 30 min uten kattunge</li>
                <li>2 timer mellom kattunger</li>
                <li>Sterk lukt / grønn utflod før første kattunge</li>
                <li>Mor virker sløv eller har sterke smerter</li>
              </ul>
            </div>
          </div>
          
          <div class="section">
            <h2>4. Når kattungen er født</h2>
            <h3>🐱 Kattunge</h3>
            <ul>
              <li>Fjern fosterhinner hvis mor ikke gjør det</li>
              <li>Gni forsiktig til den puster</li>
              <li>Sjekk munn/nese</li>
              <li>Klipp navlestreng hvis nødvendig (ca. 2–3 cm)</li>
              <li>Vei og noter fødselsvekt</li>
              <li>Legg til patten så raskt som mulig</li>
            </ul>
            
            <h3>🐈‍⬛ Mor</h3>
            <ul>
              <li>Skal vaske, slikke og la kattungen die</li>
              <li>Sørg for ro og trygghet</li>
              <li>Tilby vann og litt lett mat</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>5. Rett etter fødsel</h2>
            <h3>Sjekk at alle kattunger:</h3>
            <ul>
              <li>☐ Suger</li>
              <li>☐ Er varme</li>
              <li>☐ Har økende vekt</li>
            </ul>
            
            <h3>Sjekk mor:</h3>
            <ul>
              <li>☐ Spiser</li>
              <li>☐ Er rolig</li>
              <li>☐ Ikke har illeluktende utflod</li>
            </ul>
            
            <p><strong>📌 Vei kattungene daglig – samme tidspunkt</strong></p>
          </div>
          
          <div class="section">
            <h2>6. Normal fødselsvekt og vektøkning</h2>
            <ul>
              <li>Fødselsvekt: 90–120 g (Sibir / Neva)</li>
              <li>Økning: min. 8–10 g/døgn</li>
              <li>Ca. 100 g/uke</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>7. Vanlige utfordringer</h2>
            <ul>
              <li>Kattunge finner ikke patten</li>
              <li>En henger etter i vekt</li>
              <li>Mor har lite melk</li>
              <li>Urolig mor</li>
              <li>Store kull / små kattunger</li>
            </ul>
            <p><strong>👉 Tiltak:</strong> ekstra oppfølging, bytte på patter, evt. støttefôring tidlig</p>
          </div>
          
          <div class="section emergency">
            <h2>8. Når må veterinær kontaktes?</h2>
            <ul>
              <li>Fødsel stopper opp</li>
              <li>Kattunge sitter fast</li>
              <li>Sterk blødning</li>
              <li>Mor ignorerer kattungene</li>
              <li>Kattunge puster ikke / er kald</li>
            </ul>
          </div>
          
          ${vetPhone ? `<div class="section"><h2>📞 Veterinær</h2><p><strong>${vetPhone}</strong></p></div>` : ''}
          
          ${notes ? `<div class="notes-section"><h2>📝 Mine notater</h2><p>${notes.replace(/\n/g, '<br>')}</p></div>` : ''}
          
          <div class="section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><em><strong>Viktig påminnelse:</strong> De fleste katter klarer fødselen helt selv. Din viktigste jobb er å være forberedt, observere, og gripe inn kun når nødvendig.</em></p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const equipmentChecklist = [
    { key: 'pads', label: 'Engangsunderlag' },
    { key: 'towels', label: 'Rene håndklær' },
    { key: 'scissors', label: 'Saks (renset)' },
    { key: 'cotton', label: 'Bomull / papir' },
    { key: 'scale', label: 'Kjøkkenvekt (gram)' },
    { key: 'disinfectant', label: 'Desinfeksjon (mild)' },
    { key: 'thermometer', label: 'Termometer' },
    { key: 'notepad', label: 'Notatark / logg' },
    { key: 'formula', label: 'Morsmelkerstatning + 1 ml sprøyte' },
    { key: 'vetphone', label: 'Veterinærens telefonnummer' },
  ];

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    sectionKey,
    variant = 'default'
  }: { 
    icon: React.ElementType; 
    title: string; 
    sectionKey: string;
    variant?: 'default' | 'warning' | 'emergency';
  }) => (
    <CollapsibleTrigger asChild>
      <button
        onClick={() => toggleSection(sectionKey)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors",
          variant === 'emergency' && "bg-destructive/10 hover:bg-destructive/20",
          variant === 'warning' && "bg-yellow-500/10 hover:bg-yellow-500/20",
          variant === 'default' && "bg-accent/50 hover:bg-accent"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn(
            "h-5 w-5",
            variant === 'emergency' && "text-destructive",
            variant === 'warning' && "text-yellow-600",
            variant === 'default' && "text-primary"
          )} />
          <span className="font-semibold">{title}</span>
        </div>
        {openSections[sectionKey] ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </CollapsibleTrigger>
  );

  return (
    <div ref={printRef} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Baby className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Fødselsguide</h2>
        </div>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Skriv ut PDF
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Komplett guide for drektighet og fødsel. Klikk på seksjonene for å utvide.
      </p>

      {/* Section 1: Preparation */}
      <Collapsible open={openSections.preparation}>
        <SectionHeader icon={Calendar} title="1. Før fødsel (forberedelser)" sectionKey="preparation" />
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          <div className="mt-4">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" /> Tidslinje
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>• Normal drektighet: 63–70 dager</li>
              <li>• Start tett overvåkning: dag 60</li>
              <li>• Fødekasse klar senest uke 7</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              🧺 Fødekasse
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>• Rolig, lunt, trekkfritt sted</li>
              <li>• Romtemperatur ca. 23°C</li>
              <li>• Høye nok kanter slik at mor føler seg trygg</li>
              <li>• Flere lag engangsunderlag/håndklær/fleece, men ikke altfor mykt</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <CheckSquare className="h-4 w-4" /> Utstyr (sjekkliste)
            </h4>
            <div className="space-y-2 ml-6">
              {equipmentChecklist.map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <Checkbox 
                    id={item.key}
                    checked={checklist[item.key] || false}
                    onCheckedChange={() => handleChecklistToggle(item.key)}
                  />
                  <label 
                    htmlFor={item.key} 
                    className={cn(
                      "text-sm cursor-pointer",
                      checklist[item.key] && "line-through text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4" /> Veterinærens telefonnummer
            </h4>
            <input
              type="tel"
              value={vetPhone}
              onChange={(e) => onVetPhoneChange?.(e.target.value)}
              placeholder="Legg inn telefonnummer..."
              className="w-full max-w-xs px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 2: Signs of birth */}
      <Collapsible open={openSections.signs}>
        <SectionHeader icon={Thermometer} title="2. Tegn på at fødselen nærmer seg" sectionKey="signs" />
        <CollapsibleContent className="px-4 pb-4">
          <ul className="space-y-2 text-sm text-muted-foreground mt-4 ml-6">
            <li>• Rastløs, graver/reder</li>
            <li>• Mindre matlyst</li>
            <li>• Fall i kroppstemperatur (ofte &lt; 37,8°C)</li>
            <li>• Melk i jur</li>
            <li>• Slim / klar utflod</li>
            <li>• Trekker seg unna</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3 ml-6 italic">
            👉 Dette kan vare fra timer til 1–2 døgn
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 3: Birth phases */}
      <Collapsible open={openSections.phases}>
        <SectionHeader icon={Clock} title="3. Fødselens faser" sectionKey="phases" />
        <CollapsibleContent className="px-4 pb-4 space-y-4 mt-4">
          <div className="bg-blue-500/10 p-3 rounded-lg">
            <h4 className="font-medium mb-2">🔹 Åpningsfase</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Uro, pesing, hyppige stillingsbytter</li>
              <li>• Ingen pressveer</li>
              <li>• Kan vare 6–24 timer</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 p-3 rounded-lg">
            <h4 className="font-medium mb-2">🔹 Utdrivningsfase</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Synlige rier</li>
              <li>• Kattunge fødes ca. hver 15–60 min</li>
              <li>• Pauser er normalt</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 p-3 rounded-lg">
            <h4 className="font-medium mb-2">🔹 Etterbyrdsfase</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Morkaken følger hver kattunge</li>
              <li>• Antall morkaker = antall kattunger</li>
            </ul>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Kontakt veterinær hvis:
            </h4>
            <ul className="space-y-1 text-sm ml-4">
              <li>• Kraftige rier &gt; 30 min uten kattunge</li>
              <li>• 2 timer mellom kattunger</li>
              <li>• Sterk lukt / grønn utflod før første kattunge</li>
              <li>• Mor virker sløv eller har sterke smerter</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 4: When kitten is born */}
      <Collapsible open={openSections.afterBirth}>
        <SectionHeader icon={Baby} title="4. Når kattungen er født" sectionKey="afterBirth" />
        <CollapsibleContent className="px-4 pb-4 space-y-4 mt-4">
          <div>
            <h4 className="font-medium mb-2">🐱 Kattunge</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>• Fjern fosterhinner hvis mor ikke gjør det</li>
              <li>• Gni forsiktig til den puster</li>
              <li>• Sjekk munn/nese</li>
              <li>• Klipp navlestreng hvis nødvendig (ca. 2–3 cm)</li>
              <li className="text-xs italic">Kan også bruke rene negler – hold på strengen mot kattungen for å stoppe blødning</li>
              <li>• Vei og noter fødselsvekt om mulig</li>
              <li>• Legg til patten så raskt som mulig</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">🐈‍⬛ Mor</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>• Skal vaske, slikke og la kattungen die</li>
              <li>• Sørg for ro og trygghet</li>
              <li>• Tilby vann og litt lett mat</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 5: Right after birth */}
      <Collapsible open={openSections.postBirth}>
        <SectionHeader icon={Heart} title="5. Rett etter fødsel" sectionKey="postBirth" />
        <CollapsibleContent className="px-4 pb-4 space-y-4 mt-4">
          <div>
            <h4 className="font-medium mb-2">Sjekk at alle kattunger:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>✓ Suger</li>
              <li>✓ Er varme</li>
              <li>✓ Har økende vekt</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sjekk mor:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>✓ Spiser</li>
              <li>✓ Er rolig</li>
              <li>✓ Ikke har illeluktende utflod</li>
            </ul>
          </div>

          <p className="text-sm font-medium bg-accent/50 p-3 rounded-lg">
            📌 Vei kattungene daglig – samme tidspunkt
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 6: Weight */}
      <Collapsible open={openSections.weight}>
        <SectionHeader icon={Scale} title="6. Normal fødselsvekt og vektøkning" sectionKey="weight" />
        <CollapsibleContent className="px-4 pb-4 mt-4">
          <div className="bg-accent/30 p-4 rounded-lg space-y-2">
            <p className="text-sm"><strong>Fødselsvekt:</strong> 90–120 g (Sibir / Neva)</p>
            <p className="text-sm"><strong>Økning:</strong> min. 8–10 g/døgn</p>
            <p className="text-sm"><strong>Ca. 100 g/uke</strong></p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 7: Challenges */}
      <Collapsible open={openSections.challenges}>
        <SectionHeader icon={AlertTriangle} title="7. Vanlige utfordringer" sectionKey="challenges" variant="warning" />
        <CollapsibleContent className="px-4 pb-4 mt-4">
          <ul className="space-y-1 text-sm text-muted-foreground ml-6 mb-4">
            <li>• Kattunge finner ikke patten</li>
            <li>• En henger etter i vekt</li>
            <li>• Mor har lite melk</li>
            <li>• Urolig mor</li>
            <li>• Store kull / små kattunger</li>
          </ul>
          <p className="text-sm font-medium">
            👉 <strong>Tiltak:</strong> ekstra oppfølging, bytte på patter, evt. støttefôring tidlig
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 8: Emergency */}
      <Collapsible open={openSections.emergency}>
        <SectionHeader icon={Stethoscope} title="8. Når må veterinær kontaktes?" sectionKey="emergency" variant="emergency" />
        <CollapsibleContent className="px-4 pb-4 mt-4">
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span>Fødsel stopper opp</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span>Kattunge sitter fast</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span>Sterk blødning</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span>Mor ignorerer kattungene</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span>Kattunge puster ikke / er kald</span>
              </li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 9: Notes */}
      <Collapsible open={openSections.notes}>
        <SectionHeader icon={FileText} title="9. Mine notater" sectionKey="notes" />
        <CollapsibleContent className="px-4 pb-4 mt-4">
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="Skriv dine egne notater her..."
            className="min-h-[120px]"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Important reminder */}
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
        <p className="text-sm">
          <strong>Viktig påminnelse:</strong> De fleste katter klarer fødselen helt selv. 
          Din viktigste jobb er å <em>være forberedt</em>, <em>observere</em>, og <em>gripe inn kun når nødvendig</em>.
        </p>
      </div>
    </div>
  );
}
