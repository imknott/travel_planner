// lib/flightsSky.js

export async function getFlightsSky({ from, to, departDate, returnDate = null }) {
  const isRoundTrip = Boolean(returnDate);
  const endpoint = isRoundTrip ? 'search-roundtrip' : 'search-oneway';
  const base = 'https://flights-sky.p.rapidapi.com/flights';
  const url = new URL(`${base}/${endpoint}`);

  url.searchParams.set('fromEntityId', from);       // e.g. 'JFK'
  url.searchParams.set('toEntityId', to);           // e.g. 'NRT'
  url.searchParams.set('departDate', departDate);   // 'YYYY-MM-DD'
  if (isRoundTrip) url.searchParams.set('returnDate', returnDate);
  url.searchParams.set('currency', 'USD');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'flights-sky.p.rapidapi.com',
    },
  });

  if (!res.ok) {
    throw new Error(`Flights-Sky API error ${res.status}`);
  }

  const json = await res.json();
  const items = Array.isArray(json.data) ? json.data : [];

  return items.map((f) => {
    const segments = f.segments || [];
    const firstSegment = segments[0] || {};
    const stops = segments.length > 0 ? segments.length - 1 : 0;

    // Try to normalize price
    const rawPrice = typeof f.price === 'number' ? `$${f.price.toFixed(2)}` : f.price || 'N/A';

    // Normalize duration into minutes if available (optional)
    const duration = f.duration || null;

    return {
      price: rawPrice,
      duration,
      stops,
      airline: firstSegment.marketingCarrier?.name || f.airline || 'Unknown',
      link: f.deep_link || f.herf || null,
      raw: f,
    };
  });
}
