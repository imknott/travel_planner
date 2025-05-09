import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';

// Initialize Firestore
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const COLLECTION = 'refined_dates_cache';

function getCacheKey(text) {
  return text.trim().toLowerCase();
}

export async function POST(req) {
  try {
    const { cardText } = await req.json();

    if (!cardText || typeof cardText !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const cacheKey = getCacheKey(cardText);
    const docRef = db.collection(COLLECTION).doc(cacheKey);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const isExpired = Date.now() - data.createdAt.toMillis() > CACHE_TTL_MS;

      if (!isExpired) {
        return NextResponse.json({ dates: data.dates, cached: true });
      }
    }

    const prompt = `
You are a helpful travel assistant.

Given the following trip summary, suggest 1–2 **exact round-trip date ranges** that match the described timing and are realistic. Mention how long the trip would be (e.g., 7–10 days), and be **very concise**.

Only return the date ranges in natural language (e.g., "May 5–14, about 9 days"). Do not explain anything.

Trip:
"${cardText}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const outputText =
      response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    await docRef.set({
      dates: outputText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ dates: outputText, cached: false });
  } catch (err) {
    console.error('❌ /api/refinedates error:', {
      message: err.message,
      stack: err.stack,
      details: err,
    });

    return NextResponse.json({ error: 'Failed to generate dates' }, { status: 500 });
  }
}
