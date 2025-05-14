import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { translations } from './lib/translations.js';
import { translateString } from './lib/translateFields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Required static UI translation keys
const REQUIRED_KEYS = [
  'tagline',
  'placeholder',
  'search',
  'loading',
  'quiz',
  'login',
  'signup',
  'tripSummary',
  'tripOption',
  'refineDates',
  'refiningDates',
  'suggestedDates',
  'tryAgain',
  'searchAgain',
  'bookFlights',
  'features',
  'popular',
  'about'
];

const baseLang = translations.en;
const targetLanguages = Object.keys(translations).filter((lang) => lang !== 'en');

const updated = { en: baseLang };

const translate = async () => {
  for (const lang of targetLanguages) {
    const existing = translations[lang] || {};
    const filled = {};

    for (const key of REQUIRED_KEYS) {
      const baseValue = baseLang[key];
      if (!baseValue) continue;

      if (existing[key]) {
        filled[key] = existing[key];
        continue;
      }

      if (key === 'features' && Array.isArray(baseValue)) {
        filled[key] = [];
        for (const item of baseValue) {
          const translated = await translateString(item, lang);
          filled[key].push(translated);
        }
      } else {
        const translated = await translateString(baseValue, lang);
        filled[key] = translated;
      }
    }

    updated[lang] = filled;
  }

  const output = `export const translations = ${JSON.stringify(updated, null, 2)};\n`;

  fs.writeFileSync(path.join(__dirname, '../lib/translations.js'), output, 'utf-8');
  console.log('✅ translations.js updated successfully.');
};

translate().catch((err) => {
  console.error('❌ Translation script failed:', err);
});
