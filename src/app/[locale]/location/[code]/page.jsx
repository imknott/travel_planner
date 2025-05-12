'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GoogleAds from '@/components/googleAds';
import DatePicker from '@/components/DatePicker';
import ImageCarousel from '@/components/ImageCarousel';

export default function LocationPage() {
  const { locale, code } = useParams();    // pulls [locale] and [code] from the folder names
  const router = useRouter();
  const [city, setCity] = useState('');
  const [photos, setPhotos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [historyText, setHistoryText] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // assume code is an IATA code, map to city name however you store it
    async function fetchPlace() {
      try {
        // 1) get photos, activities, history
        const res = await fetch(
          `/api/places/details?city=${encodeURIComponent(code)}`
        );
        if (!res.ok) throw new Error('Place details failed');
        const { photos, activities, history } = await res.json();
        setPhotos(photos);
        setActivities(activities);
        setHistoryText(history);
        setCity(code);
      } catch (err) {
        console.error(err);
        router.push(`/${locale}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPlace();
  }, [code, locale, router]);

  const handleHotelSearch = async () => {
    if (!checkIn || !checkOut) return;
    try {
      const res = await fetch('/api/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, checkIn, checkOut }),
      });
      const { hotels } = await res.json();
      setHotels(hotels);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading {code}…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 space-y-12">
      {/* Slideshow */}
      {photos.length > 0 && <ImageCarousel images={photos} />}

      {/* History */}
      <section>
        <h1 className="text-3xl font-bold mb-4">{city}</h1>
        <p className="prose">{historyText}</p>
      </section>

      {/* Activities */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Top Things to Do</h2>
        <ul className="list-disc ml-6 space-y-1">
          {activities.map((act, i) => (
            <li key={i}>{act}</li>
          ))}
        </ul>
      </section>

      {/* Hotel Search */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Find Hotels</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <DatePicker
            label="Check-in"
            value={checkIn}
            onChange={setCheckIn}
          />
          <DatePicker
            label="Check-out"
            value={checkOut}
            onChange={setCheckOut}
          />
          <button
            onClick={handleHotelSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Search
          </button>
        </div>
        {hotels.map((h, i) => (
          <div
            key={i}
            className="border p-4 rounded mb-3 flex flex-col sm:flex-row sm:justify-between"
          >
            <div>
              <h3 className="font-semibold">{h.name}</h3>
              <p className="text-sm">{h.address}</p>
            </div>
            <div className="mt-2 sm:mt-0 text-right">
              <p className="text-sm">From {h.price} / night</p>
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-blue-500 underline"
              >
                Book Hotel
              </a>
            </div>
          </div>
        ))}
      </section>

      {/* Ads */}
      <div>
        <GoogleAds />
      </div>
    </div>
  );
}
