'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translateUIString } from '@/lib/usetranslationApi';
import { translations } from '@/lib/translations';

// Create the context for language state and utilities
export const LanguageContext = createContext();

/**
 * LanguageProvider wraps the app and provides translation functionality.
 * It auto-detects the user's preferred language, stores preferences in localStorage,
 * and provides translation helpers to all components via context.
 */
export function LanguageProvider({ children, lang }) {
  // State to track the active language (defaults to 'en' or user-defined `lang`)
  const [language, setLanguage] = useState(lang || 'en');

  /**
   * On mount, check if a saved language preference exists in localStorage.
   * If not, fall back to browser language or default to 'en'.
   */
useEffect(() => {
  if (lang) {
    setLanguage(lang);
    localStorage.setItem('flighthacked_lang', lang);
  } else {
    const saved = localStorage.getItem('flighthacked_lang');
    const browser = navigator.language.slice(0, 2);
    const fallback = translations[browser] ? browser : 'en';
    setLanguage(saved || fallback);
  }
}, [lang]);

  /**
   * Change the current language and persist it to localStorage.
   * This will trigger a re-render of all consumers.
   */
  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('flighthacked_lang', newLang);
  };

  /**
   * Dynamically memoize the current language's translation object (`t`).
   * This ensures `t.placeholder` and other strings react to language changes.
   */
  const t = useMemo(() => {
    return translations[language] || translations['en'];
  }, [language]);

  /**
   * Utility for translating one-off UI strings via an external translation API.
   * Used when a key doesn't exist in the static `translations` file.
   */
  const translate = (text) => translateUIString(text, language);

  // Provide lang, t, translate, and the setter to the rest of the app
  return (
    <LanguageContext.Provider value={{ lang: language, changeLanguage, t, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to access language context in any component.
 * Returns: { lang, changeLanguage, t, translate }
 */
export const useLanguage = () => useContext(LanguageContext);
