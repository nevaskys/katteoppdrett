import { useState } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  BookOpen, 
  Luggage, 
  Syringe, 
  Baby, 
  Phone, 
  Palette, 
  CalendarCheck 
} from 'lucide-react';
import { BirthGuide } from '@/components/litters/BirthGuide';
import { ShowPackingList } from './ShowPackingList';
import { VaccineOverview } from './VaccineOverview';
import { KittenCalendar } from './KittenCalendar';
import { EmergencyContacts } from './EmergencyContacts';
import { ColorGeneticsReference } from './ColorGeneticsReference';
import { ImportantDeadlines } from './ImportantDeadlines';

const resources = [
  {
    id: 'birth-guide',
    title: 'Fødselsguide',
    description: 'Komplett guide for fødsel og fødselsforberedelser',
    icon: BookOpen,
    component: BirthGuide,
  },
  {
    id: 'show-packing',
    title: 'Pakkliste utstilling',
    description: 'Sjekkliste for utstillinger med egne notater',
    icon: Luggage,
    component: ShowPackingList,
  },
  {
    id: 'vaccine',
    title: 'Vaksineoversikt',
    description: 'Vaksiner for voksne katter og vaksinasjonsplan',
    icon: Syringe,
    component: VaccineOverview,
  },
  {
    id: 'kitten-calendar',
    title: 'Kattungekalender',
    description: 'Milepæler fra fødsel til levering',
    icon: Baby,
    component: KittenCalendar,
  },
  {
    id: 'emergency',
    title: 'Nødkontakter',
    description: 'Veterinær, vaktveterinær og raseklubb',
    icon: Phone,
    component: EmergencyContacts,
  },
  {
    id: 'color-genetics',
    title: 'Fargegenetikk',
    description: 'EMS-koder og arveregler',
    icon: Palette,
    component: ColorGeneticsReference,
  },
  {
    id: 'deadlines',
    title: 'Viktige frister',
    description: 'Registrering, vaksiner og chipmerking',
    icon: CalendarCheck,
    component: ImportantDeadlines,
  },
];

interface ResourcesSectionProps {
  birthGuideNotes?: string;
  birthGuideChecklist?: Record<string, boolean>;
  vetPhone?: string;
  onBirthGuideNotesChange?: (notes: string) => void;
  onBirthGuideChecklistChange?: (checklist: Record<string, boolean>) => void;
  onVetPhoneChange?: (phone: string) => void;
}

export function ResourcesSection({
  birthGuideNotes = '',
  birthGuideChecklist = {},
  vetPhone = '',
  onBirthGuideNotesChange,
  onBirthGuideChecklistChange,
  onVetPhoneChange,
}: ResourcesSectionProps) {
  return (
    <div className="stat-card">
      <h2 className="text-lg font-semibold mb-4">Ressurser & Guider</h2>
      
      <Accordion type="single" collapsible className="w-full">
        {resources.map(resource => {
          const Icon = resource.icon;
          const Component = resource.component;
          
          // Special props for BirthGuide
          const isbirthGuide = resource.id === 'birth-guide';
          
          return (
            <AccordionItem key={resource.id} value={resource.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {isbirthGuide ? (
                  <BirthGuide
                    notes={birthGuideNotes}
                    checklist={birthGuideChecklist}
                    vetPhone={vetPhone}
                    onNotesChange={onBirthGuideNotesChange || (() => {})}
                    onChecklistChange={onBirthGuideChecklistChange || (() => {})}
                    onVetPhoneChange={onVetPhoneChange || (() => {})}
                  />
                ) : (
                  <Component />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
