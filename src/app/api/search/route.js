import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getAirlineUrl } from '@/lib/getAirlineUrl'; // uses canonicalAirlineMap internally

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const COLLECTION = 'flight_cache';
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

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

    // Gemini prompt
    const prompt = `
You are a friendly travel assistant.

A user will describe their travel preferences. They may be specific or vague (e.g., "cheap flight to Japan" or "somewhere warm in Southeast Asia").

Your job is to return exactly 3 realistic round-trip flight suggestions. Each suggestion must:

- Start with a number (1., 2., 3.)
- Be a single concise sentence including:
  - From and to location
  - Month/season
  - Estimated round-trip price (USD)
  - 1–2 real airline names
- Followed by a line that says: "Book here: [link]"

⚠️ Do NOT include JSON, markdown, brackets, raw URLs inside the sentence, or fake airlines.

Examples:

1. From NYC to Tokyo in July — Around $900 round-trip on ANA or United.  
Book here: https://www.ana.co.jp

2. From LA to Bangkok in August — About $850 round-trip on EVA Air or Qatar Airways.  
Book here: https://www.evaair.com

3. From San Francisco to Hanoi this fall — Roughly $760 round-trip on Vietnam Airlines.  
Book here: https://www.vietnamairlines.com

User is flying from: "${from || 'unknown location'}"  
User query: "${userQuery}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const rawOutput = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Replace Book here: lines with clean mapped links
    const cleaned = rawOutput.replace(/Book here:.*?$/gim, (line, index) => {
      const match = rawOutput
        .split('\n')[index]
        ?.match(/on ([^.]+?)\.?$/i); // match airline name(s) before Book here

      if (!match || match.length < 2) return line;

      const airlineNames = match[1].split(/,|or|and/i).map(n => n.trim());
      const airlineLink = getAirlineUrl(airlineNames[0]);
      return airlineLink ? `Book here: ${airlineLink}` : line;
    });

    await docRef.set({
      result: cleaned,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ result: cleaned, cached: false });
  } catch (err) {
    console.error('❌ /api/search error:', {
      message: err.message,
      stack: err.stack,
      details: err,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
