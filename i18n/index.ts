import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import pt from './pt.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    // getLocales() retorna um array com as línguas do dispositivo
    lng: Localization.getLocales()[0].languageCode ?? 'pt', 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react já faz escape
    },
  });

export default i18n;
