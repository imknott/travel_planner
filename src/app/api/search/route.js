import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { scrapeKiwiFlights } from '@/lib/scrapers/kiwiSearchByCity';
import { scrapeKiwiHotels } from '@/lib/scrapers/kiwiHotelScraper';
import { scrapeKiwiCars } from '@/lib/scrapers/kiwiCarScraper';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { userQuery } = await req.json();
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid user query' }, { status: 400 });
    }

const prompt = `
You are a travel planner. Extract the following fields from the user's message. Format origin and destination(s) as lowercase slugs with hyphens and regions (e.g., "raleigh-north-carolina-united-states", "tokyo-japan").

From: <departure slug>
Destinations: <comma-separated destination slugs>
Months: <comma-separated YYYY-MM>
Duration (days): <integer>
Include Flight: <true|false>
Include Hotel: <true|false>
Include Car: <true|false>
Budget: <integer or null>
Travelers: <integer or null>
Checked Bags: <true|false>

\`\`\`
${userQuery}
\`\`\`
`;


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
      includeCar: false,
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
        case 'include car':
          fields.includeCar = value === 'true';
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

    // Fallback for months
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
      includeCar,
      travelers,
      checkedBags,
      budget,
    } = fields;

    if (!from || !destinations.length || !months.length) {
      return NextResponse.json({ error: 'Missing from, destination, or month info' }, { status: 400 });
    }

    const results = [];

    for (const destination of destinations) {
      for (const month of months) {
        const [year, monthNum] = month.split('-').map(Number);
        const sampleDates = [3, 12, 21].map(day => new Date(year, monthNum - 1, day));

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
            cars: [],
            totalCost: 0,
            perPersonCost: 0,
          };

          try {
            let flightCost = 0;
            let hotelCost = 0;
            let carCost = 0;

            if (includeFlight) {
              entry.flights = await scrapeKiwiFlights(from, destination, departDate, returnDateStr);
              flightCost = entry.flights[0] ? parseFloat(entry.flights[0].price?.replace(/[^\d.]/g, '')) * travelers : 0;
            }

            if (includeHotel) {
              entry.hotels = await scrapeKiwiHotels(destination, departDate, returnDateStr);
              const nights = durationDays;
              const roomsNeeded = Math.ceil(travelers / 2);
              const nightlyRate = entry.hotels[0] ? parseFloat(entry.hotels[0].price?.replace(/[^\d.]/g, '')) : 0;
              hotelCost = nightlyRate * nights * roomsNeeded;
            }

            if (includeCar) {
              entry.cars = await scrapeKiwiCars(destination, departDate, returnDateStr);
              carCost = entry.cars[0] ? parseFloat(entry.cars[0].price?.replace(/[^\d.]/g, '')) : 0;
            }

            const total = flightCost + hotelCost + carCost;
            entry.totalCost = Math.round(total);
            entry.perPersonCost = Math.round(total / travelers);

          } catch (err) {
            console.warn(`❌ Scraping failed for ${destination} on ${departDate}:`, err);
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
