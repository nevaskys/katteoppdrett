import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    titleKey: 'resources.birthGuide.title',
    descriptionKey: 'resources.birthGuide.description',
    icon: BookOpen,
    component: BirthGuide,
  },
  {
    id: 'show-packing',
    titleKey: 'resources.showPacking.title',
    descriptionKey: 'resources.showPacking.description',
    icon: Luggage,
    component: ShowPackingList,
  },
  {
    id: 'vaccine',
    titleKey: 'resources.vaccine.title',
    descriptionKey: 'resources.vaccine.description',
    icon: Syringe,
    component: VaccineOverview,
  },
  {
    id: 'kitten-calendar',
    titleKey: 'resources.kittenCalendar.title',
    descriptionKey: 'resources.kittenCalendar.description',
    icon: Baby,
    component: KittenCalendar,
  },
  {
    id: 'emergency',
    titleKey: 'resources.emergency.title',
    descriptionKey: 'resources.emergency.description',
    icon: Phone,
    component: EmergencyContacts,
  },
  {
    id: 'color-genetics',
    titleKey: 'resources.colorGenetics.title',
    descriptionKey: 'resources.colorGenetics.description',
    icon: Palette,
    component: ColorGeneticsReference,
  },
  {
    id: 'deadlines',
    titleKey: 'resources.deadlines.title',
    descriptionKey: 'resources.deadlines.description',
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
  const { t } = useTranslation();
  
  return (
    <div className="stat-card">
      <h2 className="text-lg font-semibold mb-4">{t('resources.title')}</h2>
      
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
                    <p className="font-medium">{t(resource.titleKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(resource.descriptionKey)}</p>
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
