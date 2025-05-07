import redis from './redis.js';
import crypto from 'crypto';

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function translateString(text, targetLang) {
  const endpoint = 'http://localhost:32768';

  const cacheKey = `translation:en:${targetLang}:${hash(text)}`;
  const cached = await redis.get(cacheKey);

  if (cached) return cached;

  const res = await fetch(`${endpoint}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'en',
      target: targetLang,
    }),
  });

  const data = await res.json();
  const translated = data.translatedText;

  // Cache for 7 days
  await redis.set(cacheKey, translated, 'EX', 60 * 60 * 24 * 7);

  return translated;
}
