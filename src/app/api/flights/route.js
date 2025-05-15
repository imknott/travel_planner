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

  const res = await fetch(`${AMADEUS_API_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = now + data.expires_in * 1000;
  return data.access_token;
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
