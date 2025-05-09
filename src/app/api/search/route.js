import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getAirlineUrl } from '@/lib/getAirlineUrl';

// Firestore init (safe for Cloud Run)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const COLLECTION = 'flight_cache';

function getCacheKey(query, from) {
  return `${query.trim().toLowerCase()}|${from?.trim().toLowerCase() || ''}`;
}

export async function POST(req) {
  try {
    const { userQuery, from } = await req.json();

    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid user query' }, { status: 400 });
    }

    const cacheKey = getCacheKey(userQuery, from);
    const docRef = db.collection(COLLECTION).doc(cacheKey);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const isExpired = Date.now() - data.createdAt.toMillis() > CACHE_TTL_MS;
      if (!isExpired) {
        return NextResponse.json({ result: data.result, cached: true });
      }
    }

    // Build Gemini prompt
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
2. Lisbon in May — About $520 nonstop on TAP Air Portugal. Book here: https://www.flytap.com

User is flying from: "${from || 'unknown location'}"  
User query: "${userQuery}"
`;

    // Generate response with Gemini
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const outputText = (await result.text()).trim();

    // Replace booking links with mapped airline URLs
    const linkedText = outputText.replace(/Book here:.*?$/gim, (line, index) => {
      const match = outputText
        .split('\n')[index]
        ?.match(/on ([^.]+?)\.? Book here:/i);

      if (!match || match.length < 2) return line;

      const airlineNames = match[1].split(/,|or|and/i).map(n => n.trim());
      const airlineLink = getAirlineUrl(airlineNames[0]);
      return airlineLink ? `Book here: ${airlineLink}` : line;
    });

    // Save to Firestore
    await docRef.set({
      result: linkedText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ result: linkedText, cached: false });
  } catch (err) {
    console.error('❌ /api/search error:', {
      message: err.message,
      stack: err.stack,
      details: err,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
