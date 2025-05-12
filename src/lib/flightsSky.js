// lib/flightsSky.js

export async function getFlightsSky({ from, to, departDate, returnDate = null }) {
  const isRoundTrip = Boolean(returnDate);
  const endpoint = isRoundTrip ? 'search-roundtrip' : 'search-oneway';
  const base = 'https://flights-sky.p.rapidapi.com/flights';
  const url = new URL(`${base}/${endpoint}`);

  // build query params
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
  // The API’s data array lives in json.data
  const items = Array.isArray(json.data) ? json.data : [];

  // Normalize each flight to include `.url`
  return items.map((f) => ({
    // spread all original fields in case you need them
    ...f,
    // Flights-Sky returns a `deep_link` you can use to book
    url: f.deep_link || f.herf || null,
  }));
}

