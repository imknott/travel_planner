import { NextResponse } from 'next/server';
import { translateString } from '@/lib/translateFields';

export async function POST(req) {
  try {
    const { text, lang } = await req.json();

    if (!text || typeof text !== 'string' || !lang) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const translated = await translateString(text, lang);
    return NextResponse.json({ translated });
  } catch (err) {
    console.error('Translation API error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
