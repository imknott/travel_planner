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
      const isExpired = Date.now() - data.createdAt.toMillis() > CACHE_TTL_MS;
      if (!isExpired) {
        return NextResponse.json({ result: data.result, cached: true });
      }
    }

    // Step 1: Use Gemini to parse the user's query into structured data
    const parsePrompt = `
Extract the following travel query into structured JSON.

Fields:
- from: departure city or airport
- to: destination (city, country, or region)
- startDate: best estimate (YYYY-MM-DD or null)
- durationDays: number of days for trip
- includeFlight: true/false
- includeHotel: true/false
- includeCar: true/false

Query: "${userQuery}"
`;

    const parseResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: parsePrompt }] }],
    });

    const json = parseResult?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const {
      from,
      to,
      startDate,
      durationDays,
      includeFlight = true
    } = JSON.parse(json);

    if (!from || !to || !startDate) {
      return NextResponse.json({ error: 'Missing required travel info' }, { status: 400 });
    }

    const origin = await mapToIATA(from);
    const destination = await mapToIATA(to);
    if (!origin || !destination) {
      return NextResponse.json({ error: 'Could not resolve locations to airport codes' }, { status: 400 });
    }

    const tripLength = Number(durationDays) || 7;
    const returnDate = getReturnDate(startDate, tripLength);

    // Step 2: Use Flights-Sky API to get flights
    const flights = includeFlight
      ? await getFlightsSky({ from: origin, to: destination, departDate: startDate, returnDate })
      : [];

    const topResults = flights.slice(0, 3); // limit to 3 cards

    // Cache the result
    await docRef.set({
      result: topResults,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      result: topResults,
      from: origin,
      to: destination,
      departDate: startDate,
      returnDate: returnDate || null,
      cached: false,
    });
  } catch (err) {
    console.error('❌ /api/search error:', {
      message: err.message,
      stack: err.stack,
      details: err,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getReturnDate(start, days) {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
