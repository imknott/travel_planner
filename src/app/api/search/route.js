// src/app/api/search/route.js

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFlightsSky } from '@/lib/flightsSky';
import { mapToIATA } from '@/lib/iataMap';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase Admin SDK once
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

    // ─── Step 1: Cache Lookup ─────────────────────────────────────────────
    const cacheKey = encodeURIComponent(userQuery.toLowerCase().trim());
    const docRef = db.collection(COLLECTION).doc(cacheKey);
    const doc = await docRef.get();
    if (doc.exists && Date.now() - doc.data().createdAt.toMillis() <= CACHE_TTL_MS) {
      return NextResponse.json({ result: doc.data().result, cached: true });
    }

    // ─── Step 2: Ask Gemini to parse user query to plain text ─────────────
    const prompt = `
You are a travel assistant. Extract the following fields from the user query. 
Return each field on its own line. If a value is missing or vague, use "null". 
Always include all 10 lines:

From: <departure city>
To: <destination city or region>
From IATA: <3-letter code or null>
To IATA: <3-letter code or null>
Start Date: <YYYY-MM-DD or null>
Start Month: <YYYY-MM or null>
Duration (days): <integer or null>
Include Flight: <true|false>
Include Hotel: <true|false>
Include Car: <true|false>

User query:
\`\`\`
${userQuery}
\`\`\`
`;

    const parseResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    // ─── Step 3: Parse Gemini Response Text ───────────────────────────────
    let rawText = typeof parseResult.text === 'function'
      ? await parseResult.text()
      : parseResult.text || parseResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const lines = rawText
      .replace(/```/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    console.log('🧾 Gemini raw response lines:', lines);

    // Create fields object with default values
    const fields = {
      from: null,
      to: null,
      fromIATA: null,
      toIATA: null,
      startDate: null,
      startMonth: null,
      durationDays: null,
      includeFlight: true,
      includeHotel: false,
      includeCar: false,
    };

    for (const line of lines) {
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      switch (key.toLowerCase()) {
        case 'from': fields.from = value !== 'null' ? value : null; break;
        case 'to': fields.to = value !== 'null' ? value : null; break;
        case 'from iata': fields.fromIATA = value !== 'null' ? value : null; break;
        case 'to iata': fields.toIATA = value !== 'null' ? value : null; break;
        case 'start date': fields.startDate = value !== 'null' ? value : null; break;
        case 'start month': fields.startMonth = value !== 'null' ? value : null; break;
        case 'duration (days)': fields.durationDays = parseInt(value) || null; break;
        case 'include flight': fields.includeFlight = value === 'true'; break;
        case 'include hotel': fields.includeHotel = value === 'true'; break;
        case 'include car': fields.includeCar = value === 'true'; break;
      }
    }

    console.log('✅ Parsed fields:', fields);

    // ─── Step 4: Fallback if missing fields ───────────────────────────────
    if (!fields.durationDays) {
      fields.durationDays = 7; // default fallback
    }

    const { from, to, fromIATA, toIATA, startDate, startMonth, durationDays, includeFlight, includeHotel, includeCar } = fields;

    if (!from || !to || !durationDays || (!startDate && !startMonth)) {
      console.warn('⚠️ Incomplete parser result:', {
        from, to, durationDays, startDate, startMonth
      });
      return NextResponse.json({ error: 'Incomplete travel info' }, { status: 400 });
    }

    // ─── Step 5: Resolve IATA Codes ──────────────────────────────────────
    const origin = fromIATA || (await mapToIATA(from));
    const destination = toIATA || (await mapToIATA(to));
    if (!origin || !destination) {
      return NextResponse.json({ error: 'Could not resolve airport codes' }, { status: 400 });
    }

    // ─── Step 6: Generate Trip Dates ─────────────────────────────────────
    const tripDates = [];
    if (startDate) {
      tripDates.push(startDate);
    } else if (startMonth) {
      const [year, month] = startMonth.split('-').map(Number);
      tripDates.push(
        new Date(year, month - 1, 3),
        new Date(year, month - 1, 12),
        new Date(year, month - 1, 21)
      );
    }

    // ─── Step 7: Fetch Flights for Each Trip ─────────────────────────────
    const results = [];

    for (const date of tripDates) {
      const departDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      const returnDate = new Date(departDate);
      returnDate.setDate(returnDate.getDate() + durationDays);
      const returnDateStr = returnDate.toISOString().split('T')[0];

      if (includeFlight) {
        try {
          const flights = await getFlightsSky({
            from: origin,
            to: destination,
            departDate,
            returnDate: returnDateStr,
          });

          results.push({
            departDate,
            returnDate: returnDateStr,
            options: flights.slice(0, 3),
          });
        } catch (e) {
          console.error('❌ Flights-Sky error for', departDate, e);
        }
      }
    }

    // ─── Step 8: Cache & Return ──────────────────────────────────────────
    await docRef.set({
      result: results,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      from: origin,
      to: destination,
      durationDays,
      includeFlight,
      includeHotel,
      includeCar,
      results,
      cached: false,
    });

  } catch (err) {
    console.error('❌ /api/search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
