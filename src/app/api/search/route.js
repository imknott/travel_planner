import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import { getFlightsSky } from '@/lib/flightsSky';
import { mapToIATA } from '@/lib/iataMap';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const COLLECTION = 'flight_cache';
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

export async function POST(req) {
  try {
    const { userQuery } = await req.json();
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid user query' }, { status: 400 });
    }

    const cacheKey = userQuery.toLowerCase().trim();
    const docRef = db.collection(COLLECTION).doc(cacheKey);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (Date.now() - data.createdAt.toMillis() <= CACHE_TTL_MS) {
        return NextResponse.json({ result: data.result, cached: true });
      }
    }

    // ─── Step 1: Parse the query via Gemini ───────────────────────────────
    const parsePrompt = `
You are a travel assistant. Given a user message, respond with **only** a JSON object containing:
- "from": departure city or airport
- "to": destination (city, country, or region)
- "startDate": YYYY-MM-DD or null
- "durationDays": integer
- "includeFlight": true/false
- "includeHotel": true/false
- "includeCar": true/false

Example:
User: "I want a flight from Boston to Paris in June for 10 days including hotel"
Response:
\`\`\`json
{"from":"Boston","to":"Paris","startDate":"2025-06-10","durationDays":10,"includeFlight":true,"includeHotel":true,"includeCar":false}
\`\`\`

Now parse this:
\`\`\`
${userQuery}
\`\`\`
`;
    const parseResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: parsePrompt,
    });

    // Extract raw text
    let raw;
    if (typeof parseResult.text === 'function') {
      raw = await parseResult.text();
    } else if (typeof parseResult.text === 'string') {
      raw = parseResult.text;
    } else {
      raw = parseResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    // Strip fences
    raw = raw.replace(/^```json/, '').replace(/```$/,'').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('❌ Parsing error:', raw, e);
      return NextResponse.json({ error: 'Failed to parse travel query' }, { status: 500 });
    }

    const {
      from,
      to,
      startDate,
      durationDays = 7,
      includeFlight = true,
      includeHotel = false,
      includeCar = false,
    } = parsed;

    if (!from || !to || !startDate) {
      return NextResponse.json({ error: 'Incomplete travel info' }, { status: 400 });
    }

    // ─── Step 2: Resolve to IATA ────────────────────────────────────────────
    const origin = await mapToIATA(from);
    const destination = await mapToIATA(to);
    if (!origin || !destination) {
      return NextResponse.json({ error: 'Could not resolve airport codes' }, { status: 400 });
    }

    // ─── Step 3: Determine return date ────────────────────────────────────
    const d0 = new Date(startDate);
    d0.setDate(d0.getDate() + Number(durationDays));
    const returnDate = d0.toISOString().split('T')[0];

    // ─── Step 4: Fetch flights ─────────────────────────────────────────────
    let flights = [];
    if (includeFlight) {
      try {
        flights = await getFlightsSky({
          from: origin,
          to: destination,
          departDate: startDate,
          returnDate,
        });
      } catch (e) {
        console.error('Flights-Sky error:', e);
        return NextResponse.json({ error: 'Failed to fetch flights' }, { status: 502 });
      }
    }

    const topResults = flights.slice(0, 3);

    // ─── Step 5: Cache & Respond ───────────────────────────────────────────
    await docRef.set({
      result: topResults,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      result: topResults,
      from: origin,
      to: destination,
      departDate: startDate,
      returnDate,
      includeHotel,
      includeCar,
      cached: false,
    });
  } catch (err) {
    console.error('❌ /api/search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
