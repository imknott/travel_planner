import { NextResponse } from 'next/server';

export async function GET(req) {
  const city = req.nextUrl.searchParams.get('city');
  // 1) Text‐search: find place_id for city
  const ts = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(city)}&key=${process.env.GOOGLE_PLACES_KEY}`);
  const { results } = await ts.json();
  if (!results?.length) return NextResponse.json({}, { status: 404 });

  const placeId = results[0].place_id;
  // 2) Details (history snippet + photos)
  const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,photo,review&key=${process.env.GOOGLE_PLACES_KEY}`);
  const detail = await detailRes.json();
  const photos = (detail.result.photos||[]).slice(0,5).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${process.env.GOOGLE_PLACES_KEY}`);
  // 3) Activities from reviews or use “things to do” API (or fallback static list)
  const activities = (detail.result.reviews||[]).slice(0,5).map(r => r.text);

  // 4) History via Wikipedia (optional)
  const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
  const { extract } = await wiki.json();

  return NextResponse.json({
    photos,
    activities,
    history: extract,
  });
}
