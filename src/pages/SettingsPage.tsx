import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { toast } from 'sonner';
import { supportedLanguages, changeLanguage } from '@/i18n';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { profile, loading, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState(() => {
    return i18n.language || 'nb';
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
    changeLanguage(value);
    toast.success(t('settings.language.selected') + ': ' + (supportedLanguages.find(l => l.code === value)?.name || value));
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
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.description')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.language.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.language.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language.select')}</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder={t('settings.language.select')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {supportedLanguages.map((lang) => (
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
                {t('settings.language.selected')}: {supportedLanguages.find(l => l.code === language)?.name || 'Norsk'}
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
