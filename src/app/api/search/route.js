import { NextResponse } from 'next/server';
import { ollama } from '@/lib/ollama';
import { autoTranslateToEnglish } from '@/lib/translate';
import { translateString } from '@/lib/translateFields';

export async function POST(req) {
  try {
    const { userQuery, from, lang } = await req.json();

    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid user query' }, { status: 400 });
    }

    // Step 1: Auto-translate query to English
    const { translatedText, originalLang } = await autoTranslateToEnglish(userQuery);

    // Step 2: Build LLM prompt
    const prompt = `
You are a friendly travel assistant. A user will describe their trip preferences.

Your job is to return exactly 3 realistic flight suggestions that match their:
- Departure location
- Destination or region
- Budget (USD)
- Travel dates or time frame
- Layover preferences

Each suggestion should be 1–2 short, natural-language sentences, including:
• Departure Location
• Destination
• Rough travel dates
• Approximate price
• Airline(s) and a real booking link
• Layover info if relevant

Example format (NO markdown or code blocks):

1. From Raleigh, North Carolina there is a flight to Tokyo in April — Around $780 round-trip on United or JAL. Includes 1 layover in Chicago. Book here: https://www.united.com

2. Lisbon in May — About $520 nonstop on TAP Portugal. Book here: https://www.flytap.com

Do not use colons, brackets, or bullet lists. Do not return JSON.

User is flying from: "${from || 'unknown location'}"
User query: "${translatedText}"
`;

    // Step 3: Get Ollama response
    const response = await ollama.chat({
      model: 'mistral',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let outputText = response.message.content;

    // Step 4: Translate result back to original language if needed
    const targetLang = lang || originalLang;
    if (targetLang !== 'en') {
      outputText = await translateString(outputText, targetLang);
    }

    return NextResponse.json({ result: outputText });
  } catch (err) {
    console.error('❌ /api/search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
