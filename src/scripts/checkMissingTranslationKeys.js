
import { translations } from '../lib/translations.js';

const baseLang = 'en';
const requiredKeys = [
  "tagline",
  "placeholder",
  "search",
  "loading",
  "quiz",
  "login",
  "signup",
  "features",
  "popular",
  "tripSummary",
  "tripOption",
  "refineDates",
  "refiningDates",
  "suggestedDates",
  "tryAgain",
  "searchAgain",
  "bookFlights",
  "generateResults",
  "restart",
  "yourPreferences",
  "next"
];
const langs = Object.keys(translations);

for (const lang of langs) {
  if (lang === baseLang) continue;
  const missing = requiredKeys.filter((key) => !translations[lang]?.[key]);
  if (missing.length > 0) {
    console.log(`🚫 Missing keys in '{lang}':`, missing);
  } else {
    console.log(`✅ {lang} is complete.`);
  }
}
