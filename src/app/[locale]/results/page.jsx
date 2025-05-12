'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import GoogleAds from '@/components/googleAds';

export default function ResultsPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [results, setResults] = useState([]);
  const [routeInfo, setRouteInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('flighthacked_result');
    if (!stored) {
      toast.error('No results found. Please start a new search.');
      router.push(`/${lang}`);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setResults(parsed.result || []);
      setRouteInfo({
        from: parsed.from,
        to: parsed.to,
        departDate: parsed.departDate,
        returnDate: parsed.returnDate,
      });
    } catch {
      toast.error('Invalid results format.');
      router.push(`/${lang}`);
    } finally {
      setLoading(false);
    }
  }, [router, lang]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    const input = sessionStorage.getItem('flighthacked_input');
    if (!input) {
      toast.error('Missing previous search input.');
      setRegenerating(false);
      return;
    }

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input }),
      });
      const data = await res.json();
      sessionStorage.setItem('flighthacked_result', JSON.stringify(data));
      setResults(data.result || []);
      setRouteInfo({
        from: data.from,
        to: data.to,
        departDate: data.departDate,
        returnDate: data.returnDate,
      });
    } catch {
      toast.error('Failed to regenerate suggestions.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center text-lg">
        {t.loading || 'Fetching travel packages...'}
      </div>
    );
  }

  // Group by airline
  const grouped = results.reduce((acc, flight) => {
    const key = flight.airline || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(flight);
    return acc;
  }, {});

  const isRoundTrip = Boolean(routeInfo.returnDate);

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-3xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6 text-[#007BFF]">
        {t.tripSummary || 'Your trip options'}
      </h1>

      {Object.entries(grouped).map(([airline, flights]) => (
        <div key={airline}>
          <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-700 dark:text-gray-300">
            {airline}
          </h2>

          <div className="space-y-6">
            {flights.map((flight, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-lg shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-blue-600">
                    {routeInfo.from} → {routeInfo.to}
                  </span>
                  <span className="text-xl">
                    {isRoundTrip ? '🔁' : '➡️'}
                  </span>
                </div>

                <p className="text-sm mb-1">
                  <strong>Price:</strong> {flight.price}
                </p>
                <p className="text-sm mb-1">
                  <strong>Dates:</strong>{' '}
                  {routeInfo.departDate} → {routeInfo.returnDate || 'One-way'}
                </p>
                {flight.duration && (
                  <p className="text-sm mb-1">
                    <strong>Duration:</strong> {flight.duration}
                  </p>
                )}
                {flight.link && (
                  <a
                    href={flight.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    {t.bookNow || 'Book Now'}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Regenerate Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium text-slate-900 dark:text-white px-5 py-2 rounded transition disabled:opacity-50"
        >
          {regenerating
            ? t.regenerating || 'Regenerating...'
            : t.tryAgain || 'Try again'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <button
          onClick={() => {
            sessionStorage.clear();
            router.push(`/${lang}`);
          }}
          className="inline-block px-5 py-2 bg-[#007BFF] hover:bg-[#005fcc] text-white rounded transition text-sm"
        >
          🔁 {t.searchAgain || 'Search Again'}
        </button>
      </div>

      <div className="mt-10">
        <GoogleAds />
      </div>
    </div>
  );
}
