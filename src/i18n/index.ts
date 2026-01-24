import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import nb from './locales/nb.json';
import en from './locales/en.json';

// Map of language codes to their translation resources
export const resources = {
  nb: { translation: nb },
  en: { translation: en },
} as const;

// Supported languages with their display names
export const supportedLanguages = [
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
] as const;

// Get saved language or default to Norwegian
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem('app_language');
  if (saved && supportedLanguages.some(lang => lang.code === saved)) {
    return saved;
  }
  return 'nb'; // Default to Norwegian
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'nb', // Fallback to Norwegian
    
    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage'],
    },
  });

// Function to change language
export const changeLanguage = (languageCode: string) => {
  localStorage.setItem('app_language', languageCode);
  i18n.changeLanguage(languageCode);
};

export default i18n;
