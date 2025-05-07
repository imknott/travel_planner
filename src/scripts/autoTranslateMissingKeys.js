
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations } from '../lib/translations.js';
import { translateString } from '../lib/translateFields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requiredKeys = ["tagline", "placeholder", "search", "loading", "quiz", "login", "signup", "features", "popular", "tripSummary", "tripOption", "refineDates", "refiningDates", "suggestedDates", "tryAgain", "searchAgain", "bookFlights", "generateResults", "restart", "yourPreferences", "next"];
const baseLang = 'en';
const updated = { ...translations };

async function fillMissingKeys() {
  const base = translations[baseLang];
  const languages = Object.keys(translations).filter(l => l !== baseLang);

  for (const lang of languages) {
    if (!updated[lang]) updated[lang] = {};

    for (const key of requiredKeys) {
      if (!updated[lang][key]) {
        const baseText = base[key];
        if (!baseText) continue;

        if (Array.isArray(baseText)) {
          updated[lang][key] = [];
          for (const item of baseText) {
            const translated = await translateString(item, lang);
            updated[lang][key].push(translated);
          }
        } else {
          const translated = await translateString(baseText, lang);
          updated[lang][key] = translated;
        }
        console.log(`✔ Translated {key} for {lang}`);
      }
    }
  }

  const output = 'export const translations = ' + JSON.stringify(updated, null, 2) + ';\n';
  const outPath = path.join(__dirname, '../lib/translations.js');
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log('✅ translations.js has been updated with missing keys.');
}

fillMissingKeys().catch(err => {
  console.error('❌ Failed to translate:', err);
});
