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
    const firstSegment = f.segments?.[0] || {};
    const lastSegment = f.segments?.[f.segments.length - 1] || {};

    return {
      price: f.price || 'N/A',
      duration: f.duration || null,
      stops: (f.segments?.length || 1) - 1,
      airline: firstSegment.marketingCarrier?.name || f.airline || 'Unknown',
      link: f.deep_link || f.herf || null,

      // Include raw data just in case
      raw: f,
    };
  });
}
