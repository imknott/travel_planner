// src/app/api/search/route.js
import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { getFlightsSky } from '@/lib/flightsSky'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}
const db = admin.firestore()

const COLLECTION = 'flight_cache'
const CACHE_TTL_MS = 1000 * 60 * 10 // 10 minutes

export async function POST(req) {
  try {
    const { userQuery } = await req.json()
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid user query' },
        { status: 400 }
      )
    }

    // sanitize for Firestore doc ID
    const cacheKey = encodeURIComponent(userQuery.toLowerCase().trim())
    const docRef = db.collection(COLLECTION).doc(cacheKey)
    const doc = await docRef.get()
    if (doc.exists) {
      const data = doc.data()
      if (Date.now() - data.createdAt.toMillis() <= CACHE_TTL_MS) {
        return NextResponse.json({ result: data.result, cached: true })
      }
    }

    // ─── Step 1: Parse the query via your parse-query API ───────────────
    const parseRes = await fetch(
      `${process.env.BASE_URL}/api/parse-query`,
      {
        method: 'POST',
        'x-internal-secret': process.env.INTERNAL_SECRET,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      }
    )
    if (!parseRes.ok) {
      console.error('Parse-query failed:', await parseRes.text())
      return NextResponse.json(
        { error: 'Failed to parse travel query' },
        { status: 502 }
      )
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
    } = await parseRes.json()

    if (!from || !to || !startDate) {
      return NextResponse.json(
        { error: 'Incomplete travel info from parser' },
        { status: 400 }
      )
    }

    // ─── Step 2: Resolve to IATA if parser couldn’t ──────────────────────
    const origin = fromIATA || (await mapToIATA(from))
    const destination = toIATA || (await mapToIATA(to))
    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Could not resolve airport codes' },
        { status: 400 }
      )
    }

    // ─── Step 3: Compute return date ────────────────────────────────────
    const depart = new Date(startDate)
    depart.setDate(depart.getDate() + Number(durationDays))
    const returnDate = depart.toISOString().split('T')[0]

    // ─── Step 4: Fetch flights ───────────────────────────────────────────
    let flights = []
    if (includeFlight) {
      try {
        flights = await getFlightsSky({
          from: origin,
          to: destination,
          departDate: startDate,
          returnDate,
        })
      } catch (e) {
        console.error('Flights-Sky error:', e)
        return NextResponse.json(
          { error: 'Failed to fetch flights' },
          { status: 502 }
        )
      }
    }

    const topResults = flights.slice(0, 3)

    // ─── Step 5: Cache & Respond ─────────────────────────────────────────
    await docRef.set({
      result: topResults,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      result: topResults,
      from: origin,
      to: destination,
      departDate: startDate,
      returnDate,
      includeHotel,
      includeCar,
      cached: false,
    })
  } catch (err) {
    console.error('❌ /api/search error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
