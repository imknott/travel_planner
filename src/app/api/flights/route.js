import { NextResponse } from 'next/server';

const AMADEUS_API_BASE = 'https://test.api.amadeus.com'; // use 'https://api.amadeus.com' in production

let tokenCache = {
  token: null,
  expiresAt: 0,
};

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }

const res = await fetch(`${AMADEUS_API_BASE}/v2/shopping/flight-offers?${params.toString()}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (!res.ok) {
  const error = await res.text();
  console.error(`❌ Amadeus API error: ${res.status} — ${error}`);
  return NextResponse.json({ error: 'Amadeus API error' }, { status: res.status });
}

const data = await res.json();
return NextResponse.json(data.data); // return only offers
}

export async function POST(req) {
  try {
    const { from, to, departDate, returnDate, travelers = 1 } = await req.json();

    if (!from || !to || !departDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = await getAccessToken();

    const params = new URLSearchParams({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: departDate,
      adults: travelers.toString(),
      currencyCode: 'USD',
      max: '5',
    });

    if (returnDate) {
      params.set('returnDate', returnDate);
    }

    const res = await fetch(`${AMADEUS_API_BASE}/v2/shopping/flight-offers?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Amadeus flight search failed:', err);
    return NextResponse.json({ error: 'Flight search failed' }, { status: 500 });
  }
}
