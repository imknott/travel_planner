import { NextResponse } from 'next/server';

export async function POST(req) {
  const { city, checkIn, checkOut } = await req.json();
  // call your hotel API (e.g. via RapidAPI)
  const res = await fetch('https://booking-com21.p.rapidapi.com/api/v1/hotels/search', {
    method: 'POST',
    headers: {
      'content-type':'application/json',
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'booking-com21.p.rapidapi.com'
    },
    body: JSON.stringify({ city, checkin: checkIn, checkout: checkOut })
  });
  const data = await res.json();
  return NextResponse.json({ hotels: data.results || [] });
}
