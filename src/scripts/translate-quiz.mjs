import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { translateString } from '../lib/translateFields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source questions (English)
const questions = [
  {
    id: 'group',
    question: 'Who are you traveling with?',
    options: ['Solo', 'Couple', 'Family with children', 'Friends', 'Partner or spouse', 'Other']
  },
  {
    id: 'continent',
    question: 'What region are you most interested in?',
    options: ['Europe', 'Asia', 'South America', 'Anywhere!'],
  },
  {
    id: 'budget',
    question: 'What’s your ideal flight budget?',
    options: ['<$300', '$300-$500', '$500-$800', 'No limit']
  },
  {
    id: 'season',
    question: 'When do you want to travel?',
    options: ['Spring', 'Summer', 'Fall', 'Winter'],
  },
  {
    id: 'vibe',
    question: 'What kind of trip are you looking for?',
    options: ['Adventure', 'Relaxation', 'City life', 'Cultural', 'Remote/nature'],
  },
  {
    id: 'features',
    question: 'What features are important in your destination?',
    type: 'multi',
    options: [
      'LGBTQ+ friendly',
      'Culturally rich',
      'Historical landmarks',
      'Diverse communities',
      'Easy public transit',
      'Safe overall',
      'Disability accessible',
      'Solo female travel safe',
      'Nightlife & social scene',
      'Nature & outdoors',
      'Foodie destination',
    ],
  },
  {
    id: 'visa',
    question: 'Do you have any visa/passport restrictions?',
    options: ['No restrictions', 'US passport only', 'EU passport only', 'Need visa-free destinations', 'Other/complicated'],
  }
];

const supportedLanguages = ['es', 'fr', 'de', 'pt', 'ja', 'zh', 'ar', 'hi', 'ru'];
const baseLang = 'en';

const result = { [baseLang]: {} };
questions.forEach((q) => {
  result[baseLang][q.id] = { question: q.question, options: q.options };
});

const translate = async () => {
  for (const lang of supportedLanguages) {
    result[lang] = {};

    for (const q of questions) {
      const translatedQ = await translateString(q.question, lang);
      const translatedOpts = [];

      for (const opt of q.options) {
        translatedOpts.push(await translateString(opt, lang));
      }

      result[lang][q.id] = {
        question: translatedQ,
        options: translatedOpts
      };
    }
  }

  const outPath = path.join(__dirname, '../lib/quizTranslations.js');
  fs.writeFileSync(outPath, `export const quizTranslations = ${JSON.stringify(result, null, 2)};\n`);
  console.log('✅ quizTranslations.js generated successfully.');
};

translate().catch((err) => {
  console.error('❌ Failed to generate quizTranslations:', err);
});
