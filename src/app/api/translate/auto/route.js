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
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const textHash = hash(text);

    // 1. Detect source language (cached)
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
      await redis.set(detectKey, sourceLang, 'EX', 60 * 60 * 24 * 7);
    }

    if (sourceLang === 'en') {
      return NextResponse.json({ translatedText: text, originalLang: 'en' });
    }

    // 2. Translate (cached)
    const translateKey = `translate:${sourceLang}:en:${textHash}`;
    let translatedText = await redis.get(translateKey);

    if (!translatedText) {
      const translateRes = await fetch(`${endpoint}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: sourceLang, target: 'en' }),
      });

      const translated = await translateRes.json();
      translatedText = translated.translatedText;

      await redis.set(translateKey, translatedText, 'EX', 60 * 60 * 24 * 7);
    }

    return NextResponse.json({ translatedText, originalLang: sourceLang });
  } catch (err) {
    console.error('[API] Auto-translate error:', err);
    return NextResponse.json({ error: 'Auto-translate failed' }, { status: 500 });
  }
}
