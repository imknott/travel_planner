import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAirlineUrl } from '@/lib/getAirlineUrl'; // Adjust path as needed

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function POST(req) {
  try {
    const { userQuery, from } = await req.json();
    console.log('✅ Gemini API key loaded?', Boolean(process.env.GEMINI_API_KEY));


    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid user query' }, { status: 400 });
    }

    const prompt = `
You are a friendly travel assistant. A user will describe their trip preferences in any language.

Your job is to return exactly 3 realistic flight suggestions that match their:
- Departure location
- Destination or region
- Budget (USD)
- Travel dates or time frame
- Layover preferences

Each suggestion must be a 1–2 sentence natural-language response, including:
• From and to locations
• Rough travel dates
• Estimated price
• Airline name(s)
• A realistic booking link (e.g., https://www.delta.com)

⚠️ Do not use markdown, brackets, or colons. Do not return JSON. Write in the **same language** as the user's query.

Examples:

1. From Raleigh, NC to Tokyo in April — Around $780 round-trip on United or ANA. Includes 1 layover in Chicago. Book here: https://www.united.com  
2. Lisbon in May — About $520 nonstop on TAP Portugal. Book here: https://www.flytap.com

User is flying from: "${from || 'unknown location'}"  
User query: "${userQuery}"
`;

    // Step 1: Get Gemini response
    const result = await model.generateContent(prompt);
    let outputText = result.response.text();

    // Step 2: Map airline names to booking links
    outputText = outputText.replace(/Book here:.*?$/gim, (line, index) => {
      const match = outputText
        .split('\n')[index]
        ?.match(/on ([^.]+?)\.? Book here:/i);

      if (!match || match.length < 2) return line;

      const airlineNames = match[1].split(/,|or|and/i).map(n => n.trim());
      const airlineLink = getAirlineUrl(airlineNames[0]);

      return airlineLink ? `Book here: ${airlineLink}` : line;
    });

    return NextResponse.json({ result: outputText });
  } catch (err) {
    console.error('❌ /api/search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
