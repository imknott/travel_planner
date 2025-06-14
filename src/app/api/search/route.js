import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCachedCityCode, saveCityCode } from '@/lib/iataCache';
import { getCachedHotelIds, saveHotelIds } from '@/lib/hotelIdCache';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AMADEUS_API_BASE = 'https://api.amadeus.com';
let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

async function getAmadeusAccessToken() {
  const now = Date.now();
  if (accessTokenCache.token && now < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
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
  accessTokenCache.token = data.access_token;
  accessTokenCache.expiresAt = Date.now() + data.expires_in * 1000;
  return data.access_token;
}

async function getHotelOffers(city, checkInDate, checkOutDate, adults) {
  const token = await getAmadeusAccessToken();

  // 1. Get or resolve cityCode
  let cityCode = await getCachedCityCode(city);
  if (!cityCode) {
    const locationRes = await fetch(`${AMADEUS_API_BASE}/v1/reference-data/locations?keyword=${city}&subType=CITY`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const locationData = await locationRes.json();
    cityCode = locationData.data?.[0]?.iataCode;
    if (cityCode) await saveCityCode(city, cityCode);
    else {
      console.warn(`⚠️ No cityCode found for city: ${city}`);
      return [];
    }
  }

  // 2. Get or fetch hotelIds for cityCode
  let hotelIds = await getCachedHotelIds(city);
  if (!hotelIds) {
    const hotelIdRes = await fetch(
      `${AMADEUS_API_BASE}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const hotelIdData = await hotelIdRes.json();
    hotelIds = hotelIdData.data?.map(h => h.hotelId).slice(0, 10);
    if (hotelIds?.length) await saveHotelIds(city, hotelIds);
    else {
      console.warn(`⚠️ No hotelIds found for cityCode: ${cityCode}`);
      return [];
    }
  }

  // 3. Fetch hotel offers with hotelIds
  const params = new URLSearchParams({
    hotelIds: hotelIds.join(','),
    checkInDate,
    checkOutDate,
    adults: adults.toString(),
    currency: 'USD',
    sort: 'PRICE',
  });

  const url = `${AMADEUS_API_BASE}/v3/shopping/hotel-offers?${params}`;
  console.log('🏨 Fetching hotels:', url);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Hotel API error ${res.status}: ${errText}`);
    return [];
  }

  const data = await res.json();

  return (data.data || []).slice(0, 3).map(hotel => {
    const offer = hotel.offers?.[0];
    return {
      name: hotel.hotel.name,
      address: hotel.hotel.address?.lines?.[0],
      price: offer?.price?.total,
      currency: offer?.price?.currency,
      checkInDate,
      checkOutDate,
    };
  });
}

export async function POST(req) {
  try {
    const { userQuery } = await req.json();
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid user query' }, { status: 400 });
    }

    const prompt = `
You are a travel planner. Extract the following fields from the user's message. Format origin and destination(s) as lowercase slugs with hyphens and regions (e.g., "raleigh", "tokyo").

From: <departure slug>
Destinations: <comma-separated destination slugs>
Months: <comma-separated YYYY-MM>
Duration (days): <integer>
Include Flight: <true|false>
Include Hotel: <true|false>
Budget: <integer or null>
Travelers: <integer or null>
Checked Bags: <true|false>

\n\n\n${userQuery}\n\n\n`;

    const parseResult = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text = typeof parseResult.text === 'function'
      ? await parseResult.text()
      : parseResult.text || parseResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const lines = text.replace(/```/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    console.log('🧾 Gemini raw lines:', lines);

    const fields = {
      from: null,
      destinations: [],
      months: [],
      durationDays: 7,
      includeFlight: true,
      includeHotel: false,
      budget: null,
      travelers: 1,
      checkedBags: false,
    };

    for (const line of lines) {
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      switch (key.toLowerCase()) {
        case 'from':
          fields.from = value !== 'null' ? value : null;
          break;
        case 'destinations':
          fields.destinations = value !== 'null' ? value.split(',').map(v => v.trim()) : [];
          break;
        case 'months':
          fields.months = value !== 'null' ? value.split(',').map(v => v.trim()) : [];
          break;
        case 'duration (days)':
          fields.durationDays = parseInt(value) || 7;
          break;
        case 'include flight':
          fields.includeFlight = value === 'true';
          break;
        case 'include hotel':
          fields.includeHotel = value === 'true';
          break;
        case 'budget':
          fields.budget = value !== 'null' ? parseInt(value) : null;
          break;
        case 'travelers':
          fields.travelers = value !== 'null' ? parseInt(value) : 1;
          break;
        case 'checked bags':
          fields.checkedBags = value === 'true';
          break;
      }
    }

    if (!fields.months.length) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      fields.months = [
        `${y}-${String(m + 1).padStart(2, '0')}`,
        `${m === 11 ? y + 1 : y}-${String((m + 2) % 12 || 12).padStart(2, '0')}`,
      ];
    }

    const {
      from,
      destinations,
      months,
      durationDays,
      includeFlight,
      includeHotel,
      travelers,
      checkedBags,
      budget,
    } = fields;

    if (!from || !destinations.length || !months.length) {
      return NextResponse.json({ error: 'Missing from, destination, or month info' }, { status: 400 });
    }

    const results = [];
    const now = new Date();

    for (const destination of destinations) {
      for (const month of months) {
        let [year, monthNum] = month.split('-').map(Number);
        const testDate = new Date(year, monthNum - 1, 1);
        if (testDate < now) year += 1;

        const sampleDates = [3, 12, 21]
          .map(day => new Date(year, monthNum - 1, day))
          .filter(date => date >= now);

        for (const depart of sampleDates) {
          const departDate = depart.toISOString().split('T')[0];
          const returnDate = new Date(depart);
          returnDate.setDate(returnDate.getDate() + durationDays);
          const returnDateStr = returnDate.toISOString().split('T')[0];

          const entry = {
            from,
            destination,
            departDate,
            returnDate: returnDateStr,
            travelers,
            checkedBags,
            flights: [],
            hotels: [],
            totalCost: 0,
            perPersonCost: 0,
          };

          try {
            let flightCost = 0;
            let hotelCost = 0;

            // ✅ resolve city codes
            let fromCode = await getCachedCityCode(from);
            let destinationCode = await getCachedCityCode(destination);

            if (!fromCode || !destinationCode) {
              const token = await getAmadeusAccessToken();

              if (!fromCode) {
                const res = await fetch(`${AMADEUS_API_BASE}/v1/reference-data/locations?keyword=${from}&subType=CITY`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                fromCode = data.data?.[0]?.iataCode;
                if (fromCode) await saveCityCode(from, fromCode);
              }

              if (!destinationCode) {
                const res = await fetch(`${AMADEUS_API_BASE}/v1/reference-data/locations?keyword=${destination}&subType=CITY`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                destinationCode = data.data?.[0]?.iataCode;
                if (destinationCode) await saveCityCode(destination, destinationCode);
              }
            }

            // ✈️ Flights
            if (includeFlight && fromCode && destinationCode) {
              const token = await getAmadeusAccessToken();
              const params = new URLSearchParams({
                originLocationCode: fromCode,
                destinationLocationCode: destinationCode,
                departureDate: departDate,
                adults: travelers.toString(),
                currencyCode: 'USD',
                max: '3',
              });
              params.set('returnDate', returnDateStr);

              const res = await fetch(`${AMADEUS_API_BASE}/v2/shopping/flight-offers?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              const flightData = await res.json();
              const rawFlights = flightData.data || [];
              entry.flights = rawFlights.slice(0, 3).map(flight => {
                const itinerary = flight.itineraries?.[0];
                const segments = itinerary?.segments || [];
                return {
                  airline: flight.validatingAirlineCodes?.[0] || 'Unknown',
                  duration: itinerary?.duration || 'N/A',
                  price: flight.price?.total || '0',
                  stops: segments.length > 1 ? segments.length - 1 : 0,
                };
              });

              flightCost = entry.flights[0]
                ? parseFloat(entry.flights[0].price || '0') * travelers
                : 0;

              console.log('🛫 Flights:', entry.flights);
            }

            // 🏨 Hotels
            if (includeHotel) {
              entry.hotels = await getHotelOffers(destination, departDate, returnDateStr, travelers);
              hotelCost = entry.hotels[0]
                ? parseFloat(entry.hotels[0].price || '0') * durationDays * Math.ceil(travelers / 2)
                : 0;
              console.log('🏨 Hotels:', entry.hotels);
            }

            const total = flightCost + hotelCost;
            entry.totalCost = Math.round(total);
            entry.perPersonCost = Math.round(total / travelers);

          } catch (err) {
            console.warn(`❌ Failed for ${destination} on ${departDate}:`, err);
          }

          results.push(entry);
        }
      }
    }

    return NextResponse.json({
      ...fields,
      results,
    });
  } catch (err) {
    console.error('❌ /api/search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
