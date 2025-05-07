'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '@/lib/translations';

export const LanguageContext = createContext();

export function LanguageProvider({ children,lang }) {
    const [language, setLanguage] = useState(lang || 'en');

  useEffect(() => {
    const saved = localStorage.getItem('flighthacked_lang');
    const browser = navigator.language.slice(0, 2);
    const fallback = translations[browser] ? browser : 'en';
    setLang(saved || fallback);
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('flighthacked_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t: translations[lang] || translations['en'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
