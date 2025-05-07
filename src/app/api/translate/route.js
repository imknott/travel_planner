import { NextResponse } from 'next/server';
import crypto from 'crypto';

let redis;
if (typeof window === 'undefined') {
  const { default: Redis } = await import('@/lib/redis.js');
  redis = Redis;
}

const endpoint = 'http://localhost:32768';

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function POST(req) {
  try {
    const { text, target } = await req.json();
    if (!text || !target) {
      return NextResponse.json({ error: 'Missing text or target' }, { status: 400 });
    }

    const cacheKey = `translation:en:${target}:${hash(text)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json({ translated: cached });

    const res = await fetch(`${endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target }),
    });

    const data = await res.json();
    const translated = data.translatedText;

    await redis.set(cacheKey, translated, 'EX', 60 * 60 * 24 * 7);
    return NextResponse.json({ translated });
  } catch (err) {
    console.error('[API] Translation error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
