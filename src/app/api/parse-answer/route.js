// app/api/parse-answer/route.js
import { parseAnswer } from '@/lib/geminiParser';

export const runtime = 'edge'; // optional: better cold start

export async function POST(req) {
  try {
    const { answer, key } = await req.json();
    if (!answer || !key) {
      return Response.json({ error: 'Missing input' }, { status: 400 });
    }

    const parsed = await parseAnswer(answer, key);
    return Response.json(parsed);
  } catch (err) {
    console.error('Parse API error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
