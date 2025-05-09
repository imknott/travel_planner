import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getAirlineUrl } from '@/lib/getAirlineUrl';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CACHE_TTL_MS = 1000 * 60 * 10;
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
You are a friendly travel assistant...

User is flying from: "${from || 'unknown location'}"  
User query: "${userQuery}"
`;

    const result = await ai.models.generateContent({
      model: 'gemini-pro', // Or gemini-1.5-pro, gemini-2.0-flash
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const outputText = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

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
