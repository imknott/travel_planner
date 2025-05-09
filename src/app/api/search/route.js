import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getAirlineUrl } from '@/lib/getAirlineUrl';

// Initialize Firestore
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

const prompt = `
You are a travel assistant. A user will describe their travel preferences in natural language.

Your job is to return exactly 3 realistic flight suggestions based on:
- Departure location
- Destination or region
- Budget (USD)
- Travel dates or time frame
- Layover preferences

Each suggestion must be:
- A single natural-language sentence
- Realistic and specific (e.g., "From New York to Rome in September...")

Each must include:
• From and to cities
• Rough travel dates (e.g. "in July" or "this fall")
• Approximate price in USD
• Airline name(s) — only use real airlines (like Delta, United, Emirates, Lufthansa, etc.)
• A single "Book here" link at the end of the sentence (not inline)

⚠️ Output Rules:
- No markdown, brackets, colons, or code formatting
- Do not use placeholder URLs
- Use only 1 sentence per suggestion, followed by "Book here: [airline link]"

Examples:

1. From New York to Tokyo in August — Around $950 round-trip on United Airlines or ANA. Book here: https://www.united.com  
2. From Lisbon to Toronto this fall — About $550 round-trip on TAP or Air Canada. Book here: https://www.flytap.com

User is flying from: "${from || 'unknown location'}"  
User query: "${userQuery}"
`;


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const outputText =
      response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    const linkedText = outputText.replace(/Book here:.*?$/gim, (line, index) => {
      const match = outputText
        .split('\n')[index]
        ?.match(/on ([^.]+?)\.? Book here:/i);

      if (!match || match.length < 2) return line;

      const airlineNames = match[1].split(/,|or|and/i).map(n => n.trim());
      const airlineLink = getAirlineUrl(airlineNames[0]);

      return airlineLink ? `Book here: ${airlineLink}` : line;
    });

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
