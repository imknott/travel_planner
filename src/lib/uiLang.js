// lib/uiLang.js
import { translations } from './translations';

export function getTranslation(lang = 'en') {
  return translations[lang] || translations['en'];
}
