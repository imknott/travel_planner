// src/app/api/parse-query/route.js
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }

    const prompt = `
You are a travel assistant. Given a user message, extract the following fields as a JSON object:

- from: departure city or airport  
- to: destination (city, country, or region)  
- startDate: best estimate for trip start (YYYY-MM-DD or null)  
- durationDays: number of days for the trip  
- includeFlight: true or false  
- includeHotel: true or false  
- includeCar: true or false  

Respond with **only** the JSON object, no extra text.

Example:
Query: "I want a flight from Boston to Paris in June for 10 days including hotel"  
Response:
\`\`\`json
{
  "from": "Boston",
  "to": "Paris",
  "startDate": "2025-06-10",
  "durationDays": 10,
  "includeFlight": true,
  "includeHotel": true,
  "includeCar": false
}
\`\`\`

Now parse:
"${query}"
`;

    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    // Extract text from whichever API version you have
    let text;
    if (typeof response.text === 'function') {
      text = response.text();
    } else if (response.text) {
      text = response.text;
    } else if (
      response.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      text = response.candidates[0].content.parts[0].text;
    } else {
      text = '{}';
    }

    // Strip code fences if present
    text = text.trim()
      .replace(/^```json/, '')
      .replace(/```$/    , '')
      .trim();

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error('❌ JSON parse error in parse-query:', err, '\nRaw text:', text);
      return NextResponse.json({ error: 'Parsing failed' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('❌ /api/parse-query error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
