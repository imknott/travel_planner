

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFlightsSky } from '@/lib/flightsSky';
import { mapToIATA } from '@/lib/iataMap'; // Assumed helper for resolving IATA codes

// ────────────────────────────────────────────────────────────────
// Firebase Admin SDK Setup (only initialize once per instance)
// ────────────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const COLLECTION = 'flight_cache';            // Firestore collection name
const CACHE_TTL_MS = 1000 * 60 * 10;          // 10 minutes cache expiration

/**
 * POST /api/search
 *
 * This endpoint:
 * - Accepts a user natural language travel query
 * - Parses it into structured data via /api/parse-query
 * - Resolves IATA codes if needed
 * - Fetches top 3 flights from Flights-Sky API
 * - Caches and returns the result
 */
export async function POST(req) {
  try {
    // ─── Step 0: Parse request payload ──────────────────────────────
    const { userQuery } = await req.json();
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid user query' },
        { status: 400 }
      );
    }

    // ─── Step 1: Attempt to use cached result ───────────────────────
    const cacheKey = encodeURIComponent(userQuery.toLowerCase().trim());
    const docRef = db.collection(COLLECTION).doc(cacheKey);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const isFresh = Date.now() - data.createdAt.toMillis() <= CACHE_TTL_MS;

      if (isFresh) {
        return NextResponse.json({ result: data.result, cached: true });
      }
    }

    // ─── Step 2: Parse the query via internal parser API ─────────────
    const parseRes = await fetch(`${process.env.BASE_URL}/api/parse-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET, // protect from public access
      },
      body: JSON.stringify({ query: userQuery }),
    });

    if (!parseRes.ok) {
      console.error('Parse-query failed:', await parseRes.text());
      return NextResponse.json(
        { error: 'Failed to parse travel query' },
        { status: 502 }
      );
    }

    const {
      from,
      to,
      fromIATA,
      toIATA,
      startDate,
      durationDays,
      includeFlight = true,
      includeHotel = false,
      includeCar = false,
    } = await parseRes.json();

    if (!from || !to || !startDate) {
      return NextResponse.json(
        { error: 'Incomplete travel info from parser' },
        { status: 400 }
      );
    }

    // ─── Step 3: Ensure valid IATA codes ────────────────────────────
    const origin = fromIATA || (await mapToIATA(from));
    const destination = toIATA || (await mapToIATA(to));

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Could not resolve airport codes' },
        { status: 400 }
      );
    }

    // ─── Step 4: Compute return date based on trip duration ────────
    const depart = new Date(startDate);
    depart.setDate(depart.getDate() + Number(durationDays));
    const returnDate = depart.toISOString().split('T')[0];

    // ─── Step 5: Fetch flight results via API ───────────────────────
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
        return NextResponse.json(
          { error: 'Failed to fetch flights' },
          { status: 502 }
        );
      }
    }

    const topResults = flights.slice(0, 3); // limit to top 3

    // ─── Step 6: Store result in Firestore cache ────────────────────
    await docRef.set({
      result: topResults,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ─── Step 7: Return final response ──────────────────────────────
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
