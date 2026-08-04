'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import esDictionary from '@/messages/model-portal/es.json';
import enDictionary from '@/messages/model-portal/en.json';
import type { ModelPortalLocale, ModelPortalDictionary } from './model-i18n';

const dictionaries: Record<ModelPortalLocale, ModelPortalDictionary> = {
  es: esDictionary,
  en: enDictionary,
};

interface ModelI18nContextType {
  locale: ModelPortalLocale;
  setLocale: (locale: ModelPortalLocale) => void;
  t: ModelPortalDictionary;
}

const ModelI18nContext = createContext<ModelI18nContextType>({
  locale: 'es',
  setLocale: () => {},
  t: esDictionary,
});

export const ModelI18nProvider: React.FC<{ children: React.ReactNode; initialLocale?: ModelPortalLocale }> = ({
  children,
  initialLocale = 'es',
}) => {
  const [locale, setLocaleState] = useState<ModelPortalLocale>(initialLocale);

  useEffect(() => {
    // Read stored preference if any
    const saved = document.cookie
      .split('; ')
      .find((row) => row.startsWith('model_lang='))
      ?.split('=')[1];

    if (saved === 'en' || saved === 'es') {
      setLocaleState(saved);
    } else {
      // Check browser language
      const userLang = navigator.language || (navigator as any).userLanguage || '';
      if (userLang.toLowerCase().startsWith('en')) {
        setLocaleState('en');
      }
    }
  }, []);

  const setLocale = (newLocale: ModelPortalLocale) => {
    setLocaleState(newLocale);
    document.cookie = `model_lang=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
  };

  const t = dictionaries[locale] || dictionaries.es;

  return (
    <ModelI18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </ModelI18nContext.Provider>
  );
};

export const useModelI18n = () => useContext(ModelI18nContext);
