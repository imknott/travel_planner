import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { query } = await req.json();

    const prompt = `
You are a travel assistant. Given a user message, extract the following fields as a JSON object:

- from: departure city or airport
- to: destination (city, country, or region)
- startDate: best estimate for trip start (use YYYY-MM-DD format or null if unknown)
- durationDays: number of days for the trip
- includeFlight: true or false
- includeHotel: true or false
- includeCar: true or false

Example:
Query: "I want a flight from Boston to Paris in June for 10 days including hotel"
Response:
{
  "from": "Boston",
  "to": "Paris",
  "startDate": "2025-06-10",
  "durationDays": 10,
  "includeFlight": true,
  "includeHotel": true,
  "includeCar": false
}

Now parse:
"${query}"
`;

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const json = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(json);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('❌ /api/parse-query error:', err);
    return NextResponse.json({ error: 'Parsing failed' }, { status: 500 });
  }
}
