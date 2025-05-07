import redis from './redis';
import crypto from 'crypto';

const endpoint = 'http://localhost:32768';

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function autoTranslateToEnglish(text) {
  const textHash = hash(text);

  // 🔍 1. Check language detection cache
  const detectKey = `detect:${textHash}`;
  let sourceLang = await redis.get(detectKey);

  if (!sourceLang) {
    const detectRes = await fetch(`${endpoint}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text }),
    });

    const detected = await detectRes.json();
    sourceLang = detected[0]?.language || 'en';

    await redis.set(detectKey, sourceLang, 'EX', 60 * 60 * 24 * 7); // cache 7 days
  }

  // ✅ If already English, no need to translate
  if (sourceLang === 'en') {
    return { translatedText: text, originalLang: 'en' };
  }

  // 🔁 2. Check translation cache
  const translateKey = `translate:${sourceLang}:en:${textHash}`;
  let translatedText = await redis.get(translateKey);

  if (!translatedText) {
    const translateRes = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: 'en',
      }),
    });

    const translated = await translateRes.json();
    translatedText = translated.translatedText;

    await redis.set(translateKey, translatedText, 'EX', 60 * 60 * 24 * 7);
  }

  return { translatedText, originalLang: sourceLang };
}
