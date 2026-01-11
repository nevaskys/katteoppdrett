export type LitterStatus = 'planned' | 'pending' | 'active' | 'completed';

export interface MotherWeightEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface Litter {
  id: string;
  name: string;
  status: LitterStatus;
  
  // Parents
  motherId: string | null;
  fatherId: string | null;
  externalFatherName: string | null;
  externalFatherPedigreeUrl: string | null;
  
  // Dates
  matingDateFrom: string | null;
  matingDateTo: string | null;
  matingDate: string | null; // legacy, will be removed
  expectedDate: string | null;
  birthDate: string | null;
  completionDate: string | null;
  
  // Planning phase
  reasoning: string | null;
  inbreedingCoefficient: number | null;
  bloodTypeNotes: string | null;
  alternativeCombinations: string | null;
  
  // Pregnancy phase
  pregnancyNotes: string | null;
  motherWeightLog: MotherWeightEntry[];
  
  // Active phase
  kittenCount: number | null;
  
  // Completion phase
  nrrRegistered: boolean;
  evaluation: string | null;
  buyersInfo: string | null;
  
  // General
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const LITTER_STATUS_CONFIG: Record<LitterStatus, {
  label: string;
  description: string;
  color: string;
}> = {
  planned: {
    label: 'Planlagt kull',
    description: 'Kombinasjonen vurderes, parring ikke gjennomført',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  pending: {
    label: 'Ventende kull',
    description: 'Parring gjennomført, venter på fødsel',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  active: {
    label: 'Aktivt kull',
    description: 'Kattunger er født og under oppfølging',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  completed: {
    label: 'Avsluttet kull',
    description: 'Alle kattunger har flyttet',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
};
