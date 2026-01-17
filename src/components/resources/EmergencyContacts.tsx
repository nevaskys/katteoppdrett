import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Phone, Building, Clock, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: 'vet' | 'emergency' | 'club' | 'other';
  notes?: string;
}

const STORAGE_KEY = 'emergency-contacts';

const defaultContacts: Contact[] = [
  { id: '1', name: '', phone: '', type: 'vet' },
  { id: '2', name: '', phone: '', type: 'emergency' },
  { id: '3', name: '', phone: '', type: 'club' },
];

const typeLabels: Record<Contact['type'], { label: string; icon: typeof Phone }> = {
  vet: { label: 'Fastdyrlege', icon: Building },
  emergency: { label: 'Vaktveterinær', icon: Clock },
  club: { label: 'Raseklubb', icon: Building },
  other: { label: 'Annen kontakt', icon: Phone },
};

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<Contact[]>(defaultContacts);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  }, []);

  const handleChange = (id: string, field: keyof Contact, value: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    setHasChanges(false);
    toast.success('Kontakter lagret');
  };

  const handleAddContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      type: 'other',
    };
    setContacts(prev => [...prev, newContact]);
    setHasChanges(true);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setHasChanges(true);
  };

  const groupedContacts = {
    vet: contacts.filter(c => c.type === 'vet'),
    emergency: contacts.filter(c => c.type === 'emergency'),
    club: contacts.filter(c => c.type === 'club'),
    other: contacts.filter(c => c.type === 'other'),
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Hold viktige kontakter lett tilgjengelig for nødsituasjoner.
      </p>

      {(Object.keys(groupedContacts) as Array<keyof typeof groupedContacts>).map(type => {
        const { label, icon: Icon } = typeLabels[type];
        const typeContacts = groupedContacts[type];
        
        if (typeContacts.length === 0 && type !== 'other') return null;

        return (
          <div key={type} className="space-y-3">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </h3>

            {typeContacts.map(contact => (
              <div key={contact.id} className="grid gap-3 p-3 border rounded-lg bg-card">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${contact.id}`} className="text-xs">Navn</Label>
                    <Input
                      id={`name-${contact.id}`}
                      value={contact.name}
                      onChange={(e) => handleChange(contact.id, 'name', e.target.value)}
                      placeholder={`${label} navn`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`phone-${contact.id}`} className="text-xs">Telefon</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`phone-${contact.id}`}
                        value={contact.phone}
                        onChange={(e) => handleChange(contact.id, 'phone', e.target.value)}
                        placeholder="Telefonnummer"
                        type="tel"
                      />
                      {type === 'other' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveContact(contact.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    Ring nå
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleAddContact}>
          <Plus className="h-4 w-4 mr-1" />
          Legg til kontakt
        </Button>
        {hasChanges && (
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Lagre
          </Button>
        )}
      </div>
    </div>
  );
}
