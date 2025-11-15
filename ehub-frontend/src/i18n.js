import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './translations/en.json';
import frTranslation from './translations/fr.json';
import rwTranslation from './translations/rw.json';

// Define the resources
const resources = {
  en: {
    translation: enTranslation
  },
  fr: {
    translation: frTranslation
  },
  rw: {
    translation: rwTranslation
  }
};

// Get the saved language from localStorage or default to 'rw' (Kinyarwanda)
const savedLanguage = localStorage.getItem('preferred-language') || 'rw';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: savedLanguage, // language to use
    fallbackLng: 'en', // fallback language if translation is missing
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;