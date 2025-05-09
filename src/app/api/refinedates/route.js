import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

// Initialize Firebase (safe to inline for Cloud Run)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

// Gemini init
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const COLLECTION = 'refined_dates_cache';

function getCacheKey(cardText) {
  return cardText.trim().toLowerCase();
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

    // ✅ Return cached result if not expired
    if (doc.exists) {
      const data = doc.data();
      const isExpired = Date.now() - data.createdAt.toMillis() > CACHE_TTL_MS;

      if (!isExpired) {
        return NextResponse.json({ dates: data.dates, cached: true });
      }
    }

    // 🔮 Gemini prompt
    const prompt = `
You are a helpful travel assistant.

Given the following trip summary, suggest 1–2 **exact round-trip date ranges** that match the described timing and are realistic. Mention how long the trip would be (e.g., 7–10 days), and be **very concise**.

Only return the date ranges in natural language (e.g., "May 5–14, about 9 days"), with no extra explanation.

Trip:
"${cardText}"
`;

    const result = await model.generateContent(prompt);
    const outputText = result.response.text().trim();

    // ✅ Save to cache
    await docRef.set({
      dates: outputText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ dates: outputText, cached: false });
  } catch (err) {
    console.error('❌ /api/refinedates error:', {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json({ error: 'Failed to generate dates' }, { status: 500 });
  }
}
