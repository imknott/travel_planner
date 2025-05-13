import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
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

    const cacheKey = encodeURIComponent(userQuery.toLowerCase().trim());
    const docRef = db.collection(COLLECTION).doc(cacheKey);
    const doc = await docRef.get();
    if (doc.exists && Date.now() - doc.data().createdAt.toMillis() <= CACHE_TTL_MS) {
      return NextResponse.json({ result: doc.data().result, cached: true });
    }

    // ─── Gemini Prompt ───────────────────────────────────────────────
    const prompt = `
You are a professional travel planner. Given a user's request, extract exactly and only the following fields in this format. If there are multiple destinations or months, include them comma-separated. Always return these 7 lines:

From: <departure city or airport>
Destinations: <comma-separated destinations>
Months: <comma-separated YYYY-MM values>
Duration (days): <integer>
Include Flight: <true|false>
Include Hotel: <true|false>
Include Car: <true|false>

If a value is missing, return "null".
User query:
\`\`\`
${userQuery}
\`\`\`
`;

    const parseResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let rawText = typeof parseResult.text === 'function'
      ? await parseResult.text()
      : parseResult.text || parseResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const lines = rawText.replace(/```/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    console.log('🧾 Gemini raw lines:', lines);

    // ─── Parse response ─────────────────────────────────────────────
    const fields = {
      from: null,
      destinations: [],
      months: [],
      durationDays: 7,
      includeFlight: true,
      includeHotel: false,
      includeCar: false,
    };

    for (const line of lines) {
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      switch (key.toLowerCase()) {
        case 'from':
          fields.from = value !== 'null' ? value : null;
          break;
        case 'destinations':
          fields.destinations = value !== 'null' ? value.split(',').map(v => v.trim()) : [];
          break;
        case 'months':
          fields.months = value !== 'null' ? value.split(',').map(v => v.trim()) : [];
          break;
        case 'duration (days)':
          fields.durationDays = parseInt(value) || 7;
          break;
        case 'include flight':
          fields.includeFlight = value === 'true';
          break;
        case 'include hotel':
          fields.includeHotel = value === 'true';
          break;
        case 'include car':
          fields.includeCar = value === 'true';
          break;
      }
    }

    console.log('✅ Parsed fields:', fields);

    const {
      from,
      destinations,
      months,
      durationDays,
      includeFlight,
      includeHotel,
      includeCar,
    } = fields;

    if (!from || !destinations.length || !months.length) {
      return NextResponse.json({ error: 'Missing from, destination, or month info' }, { status: 400 });
    }

    const originIATA = await mapToIATA(from);
    if (!originIATA) {
      return NextResponse.json({ error: 'Could not resolve origin airport code' }, { status: 400 });
    }

    const results = [];

    for (const dest of destinations) {
      const destinationIATA = await mapToIATA(dest);
      if (!destinationIATA) continue;

      for (const month of months) {
        const [year, monthNum] = month.split('-').map(Number);
        const sampleDates = [3, 12, 21].map(day => new Date(year, monthNum - 1, day));

        for (const depart of sampleDates) {
          const departDate = depart.toISOString().split('T')[0];
          const returnDate = new Date(depart);
          returnDate.setDate(returnDate.getDate() + durationDays);
          const returnDateStr = returnDate.toISOString().split('T')[0];

          if (includeFlight) {
            try {
              const flights = await getFlightsSky({
                from: originIATA,
                to: destinationIATA,
                departDate,
                returnDate: returnDateStr,
              });

              results.push({
                from: originIATA,
                to: destinationIATA,
                departDate,
                returnDate: returnDateStr,
                destination: dest,
                options: flights.slice(0, 3),
              });
            } catch (e) {
              console.warn(`❌ Flights failed for ${dest} on ${departDate}`, e);
            }
          }
        }
      }
    }

    await docRef.set({
      result: results,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      from: originIATA,
      destinations,
      months,
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
