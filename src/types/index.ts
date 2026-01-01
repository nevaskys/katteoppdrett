export type Gender = 'male' | 'female';

export interface HealthTest {
  id: string;
  name: string;
  completed: boolean;
  date?: string;
}

export interface PreviousLitter {
  id: string;
  birthDate: string;
  fatherId?: string;
  fatherName?: string;
  kittenCount: number;
  notes?: string;
}

export interface Cat {
  id: string;
  name: string;
  breed: string;
  gender: Gender;
  birthDate: string;
  chipNumber?: string;
  registration?: string;
  color: string;
  emsCode?: string;
  healthTests?: HealthTest[];
  healthNotes?: string;
  images: string[];
  pedigreeImage?: string;
  previousLitters?: PreviousLitter[];
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number; // in grams
}

export interface Kitten {
  id: string;
  name: string;
  gender: Gender;
  color: string;
  markings?: string;
  weightLog: WeightEntry[];
}

export interface Litter {
  id: string;
  motherId: string;
  fatherId: string;
  birthDate: string;
  count: number;
  notes?: string;
  kittens: Kitten[];
  createdAt: string;
}

export type WaitlistStatus = 'new' | 'contacted' | 'waitlist' | 'deposit' | 'sold' | 'declined';

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: WaitlistStatus;
  notes?: string;
  createdAt: string;
}

export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  catId?: string;
  litterId?: string;
  kittenId?: string;
  notes?: string;
  createdAt: string;
}
