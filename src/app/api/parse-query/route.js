// src/app/api/parse-query/route.js
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { query } = await req.json();

    const prompt = `
You are a travel assistant. Given a user message, return **only** a JSON object containing these fields:
- "from": departure city or airport name
- "to": destination city, country, or region
- "fromIATA": the 3-letter IATA code for the departure
- "toIATA": the 3-letter IATA code for the destination
- "startDate": trip start (YYYY-MM-DD or null)
- "durationDays": integer number of days
- "includeFlight": true/false
- "includeHotel": true/false
- "includeCar": true/false

Example:
\`\`\`json
{
  "from":"Boston",
  "to":"Paris",
  "fromIATA":"BOS",
  "toIATA":"CDG",
  "startDate":"2025-06-10",
  "durationDays":10,
  "includeFlight":true,
  "includeHotel":true,
  "includeCar":false
}
\`\`\`

Now parse this user query:
\`\`\`
${query}
\`\`\`
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text;
    if (typeof response.text === 'function') {
      text = await response.text();
    } else {
      text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    text = text.replace(/^```json/, '').replace(/```$/,'').trim();

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('❌ /api/parse-query error:', err);
    return NextResponse.json({ error: 'Parsing failed' }, { status: 500 });
  }
}
