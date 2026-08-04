import esDictionary from '@/messages/model-portal/es.json';
import enDictionary from '@/messages/model-portal/en.json';

export type ModelPortalLocale = 'es' | 'en';
export type ModelPortalDictionary = typeof esDictionary;

const dictionaries: Record<ModelPortalLocale, ModelPortalDictionary> = {
  es: esDictionary,
  en: enDictionary,
};

/**
 * Gets the preferred locale from headers or cookies (for Server Components).
 */
export function getModelPortalLocaleFromHeaders(acceptLanguage?: string | null, cookieLang?: string | null): ModelPortalLocale {
  if (cookieLang === 'en' || cookieLang === 'es') {
    return cookieLang;
  }
  if (acceptLanguage && acceptLanguage.toLowerCase().includes('en')) {
    return 'en';
  }
  return 'es';
}

/**
 * Returns the dictionary object for the given locale.
 */
export function getModelPortalDictionary(locale: ModelPortalLocale = 'es'): ModelPortalDictionary {
  return dictionaries[locale] || dictionaries.es;
}
