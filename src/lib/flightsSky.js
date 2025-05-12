export async function getFlightsSky({ from, to, departDate, returnDate = null }) {
  const isRoundTrip = Boolean(returnDate);
  const url = `https://flights-sky.p.rapidapi.com/${isRoundTrip ? 'roundtrip' : 'oneway'}`;

  const body = {
    from,       // IATA code, e.g. "JFK"
    to,         // IATA code, e.g. "NRT"
    departDate, // format: "YYYY-MM-DD"
    currency: 'USD',
  };

  if (isRoundTrip) {
    body.returnDate = returnDate; // Add return date only if round trip
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'flights-sky.p.rapidapi.com',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data?.data || [];
}
