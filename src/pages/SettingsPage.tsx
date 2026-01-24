import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// FIFE member countries with their languages
const FIFE_LANGUAGES = [
  { code: 'nb', name: 'Norsk (bokmål)', country: 'Norge' },
  { code: 'nn', name: 'Norsk (nynorsk)', country: 'Norge' },
  { code: 'sv', name: 'Svenska', country: 'Sverige' },
  { code: 'fi', name: 'Suomi', country: 'Suomi' },
  { code: 'da', name: 'Dansk', country: 'Danmark' },
  { code: 'is', name: 'Íslenska', country: 'Ísland' },
  { code: 'de', name: 'Deutsch', country: 'Deutschland/Österreich/Schweiz/Luxemburg/Liechtenstein' },
  { code: 'nl', name: 'Nederlands', country: 'Nederland/België' },
  { code: 'fr', name: 'Français', country: 'France/Belgique/Suisse/Luxembourg/Monaco' },
  { code: 'it', name: 'Italiano', country: 'Italia/Svizzera/San Marino' },
  { code: 'es', name: 'Español', country: 'España' },
  { code: 'pt', name: 'Português', country: 'Portugal' },
  { code: 'en', name: 'English', country: 'United Kingdom' },
  { code: 'pl', name: 'Polski', country: 'Polska' },
  { code: 'cs', name: 'Čeština', country: 'Česká republika' },
  { code: 'sk', name: 'Slovenčina', country: 'Slovensko' },
  { code: 'hu', name: 'Magyar', country: 'Magyarország' },
  { code: 'ro', name: 'Română', country: 'România' },
  { code: 'bg', name: 'Български', country: 'България' },
  { code: 'hr', name: 'Hrvatski', country: 'Hrvatska' },
  { code: 'sl', name: 'Slovenščina', country: 'Slovenija' },
  { code: 'sr', name: 'Srpski', country: 'Srbija' },
  { code: 'mk', name: 'Македонски', country: 'Северна Македонија' },
  { code: 'el', name: 'Ελληνικά', country: 'Ελλάδα/Κύπρος' },
  { code: 'tr', name: 'Türkçe', country: 'Türkiye' },
  { code: 'ru', name: 'Русский', country: 'Россия' },
  { code: 'uk', name: 'Українська', country: 'Україна' },
  { code: 'be', name: 'Беларуская', country: 'Беларусь' },
  { code: 'lv', name: 'Latviešu', country: 'Latvija' },
  { code: 'lt', name: 'Lietuvių', country: 'Lietuva' },
  { code: 'et', name: 'Eesti', country: 'Eesti' },
  { code: 'ar', name: 'العربية', country: 'United Arab Emirates/Tunisia/Morocco/Egypt' },
  { code: 'he', name: 'עברית', country: 'ישראל' },
  { code: 'id', name: 'Bahasa Indonesia', country: 'Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu', country: 'Malaysia' },
  { code: 'th', name: 'ไทย', country: 'ประเทศไทย' },
  { code: 'zh', name: '中文', country: '中国/香港/台灣' },
  { code: 'ja', name: '日本語', country: '日本' },
  { code: 'ko', name: '한국어', country: '대한민국' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'nb';
  });
  
  const [formData, setFormData] = useState({
    cattery_prefix: '',
    cattery_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        cattery_prefix: profile.cattery_prefix || '',
        cattery_name: profile.cattery_name || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        address: profile.address || '',
        website: profile.website || '',
      });
    }
  }, [profile]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem('app_language', value);
    toast.success('Språk endret! Appen støtter foreløpig kun norsk grensesnitt.');
  };

  // Helper function to normalize website URL
  const normalizeWebsiteUrl = (url: string): string => {
    if (!url.trim()) return '';
    const trimmedUrl = url.trim();
    // If it doesn't start with http:// or https://, add https://
    if (!trimmedUrl.match(/^https?:\/\//i)) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Normalize the website URL before saving
    const dataToSave = {
      ...formData,
      website: normalizeWebsiteUrl(formData.website),
    };

    const { error } = await updateProfile(dataToSave);

    if (error) {
      toast.error('Kunne ikke lagre innstillinger');
      console.error('Error saving profile:', error);
    } else {
      toast.success('Innstillinger lagret!');
      // Update form data with normalized URL
      setFormData(dataToSave);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Innstillinger</h1>
          <p className="text-muted-foreground">Administrer ditt oppdrett</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Språk
            </CardTitle>
            <CardDescription>
              Velg språk for appen (FIFE-medlemsland)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">Velg språk</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Velg språk" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {FIFE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-xs text-muted-foreground">({lang.country})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Valgt språk: {FIFE_LANGUAGES.find(l => l.code === language)?.name || 'Norsk'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oppdrettsinfo</CardTitle>
            <CardDescription>
              Informasjon om ditt oppdrett som vises i appen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cattery_prefix">Landkode/Prefiks</Label>
                <Input
                  id="cattery_prefix"
                  placeholder="f.eks. NO, S, DK"
                  value={formData.cattery_prefix}
                  onChange={(e) => setFormData({ ...formData, cattery_prefix: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Landkoden som vises før stamnavnet (f.eks. "NO" for Norge)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cattery_name">Stamnavn</Label>
                <Input
                  id="cattery_name"
                  placeholder="f.eks. NevaSky's"
                  value={formData.cattery_name}
                  onChange={(e) => setFormData({ ...formData, cattery_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Ditt registrerte stamnavn
                </p>
              </div>
            </div>

            <div className="pt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Forhåndsvisning:</p>
              <p className="text-lg font-semibold">
                {formData.cattery_prefix && formData.cattery_name 
                  ? `${formData.cattery_prefix}*${formData.cattery_name}`
                  : formData.cattery_name || 'Katteoppdrett'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontaktinformasjon</CardTitle>
            <CardDescription>
              Din kontaktinformasjon (valgfritt)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-post</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="din@epost.no"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  placeholder="+47 123 45 678"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                placeholder="Din adresse"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Nettside</Label>
              <Input
                id="website"
                type="text"
                placeholder="www.ditt-oppdrett.no"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Du kan skrive med eller uten https:// (f.eks. www.example.com)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lagre innstillinger
          </Button>
        </div>
      </form>
    </div>
  );
}
