// src/app/api/parse-query/route.js
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid query' },
        { status: 400 }
      );
    }

    const prompt = `
You are a travel assistant.  Extract the following from the user’s query and return each on its own line, exactly as shown:

From: <departure city or airport name>  
To: <destination city, country, or region>  
From IATA: <3-letter code or null>  
To IATA: <3-letter code or null>  
Start Date: <YYYY-MM-DD or null>  
Duration (days): <integer>  
Include Flight: <true|false>  
Include Hotel: <true|false>  
Include Car: <true|false>  

Example output:

From: Boston  
To: Paris  
From IATA: BOS  
To IATA: CDG  
Start Date: 2025-06-10  
Duration (days): 10  
Include Flight: true  
Include Hotel: true  
Include Car: false  

Now parse this query:  
\`\`\`  
${query}  
\`\`\`
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text = '';
    if (typeof response.text === 'function') {
      text = await response.text();
    } else {
      text =
        response.candidates?.[0]?.content?.parts?.[0]?.text
        || response.text
        || '';
    }
    text = text.replace(/^```/, '').replace(/```$/, '').trim();

    // split into non-empty lines
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // build the JSON result
    const result = {
      from: null,
      to: null,
      fromIATA: null,
      toIATA: null,
      startDate: null,
      durationDays: null,
      includeFlight: false,
      includeHotel: false,
      includeCar: false,
    };

    for (let line of lines) {
      const [rawKey, ...rest] = line.split(':');
      const value = rest.join(':').trim();

      switch (rawKey.toLowerCase()) {
        case 'from':
          result.from = value || null;
          break;
        case 'to':
          result.to = value || null;
          break;
        case 'from iata':
          result.fromIATA = value.toLowerCase() === 'null' ? null : value;
          break;
        case 'to iata':
          result.toIATA = value.toLowerCase() === 'null' ? null : value;
          break;
        case 'start date':
          result.startDate = value.toLowerCase() === 'null' ? null : value;
          break;
        case 'duration (days)':
          result.durationDays = parseInt(value, 10) || 0;
          break;
        case 'include flight':
          result.includeFlight = value.toLowerCase() === 'true';
          break;
        case 'include hotel':
          result.includeHotel = value.toLowerCase() === 'true';
          break;
        case 'include car':
          result.includeCar = value.toLowerCase() === 'true';
          break;
        default:
          // ignore any unexpected lines
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('❌ /api/parse-query error:', err);
    return NextResponse.json(
      { error: 'Parsing failed' },
      { status: 500 }
    );
  }
}
