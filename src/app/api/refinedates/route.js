import { NextResponse } from 'next/server';
import { ollama } from '@/lib/ollama';

export async function POST(req) {
  try {
    const { cardText } = await req.json();

    if (!cardText || typeof cardText !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const prompt = `
You are a travel assistant. Given the following trip summary, suggest 1–2 exact round-trip date ranges that are realistic based on what was described. Include travel duration (e.g., 7–10 days) and be concise.

Trip:
"${cardText}"

Respond with only the dates in plain language. Do not return JSON or extra text.
`;

    const response = await ollama.chat({
      model: 'mistral',
      messages: [{ role: 'user', content: prompt }],
    });

    return NextResponse.json({ dates: response.message.content.trim() });
  } catch (err) {
    console.error('Refine date error:', err);
    return NextResponse.json({ error: 'Failed to generate dates' }, { status: 500 });
  }
}
