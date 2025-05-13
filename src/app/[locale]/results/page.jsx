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
  const [priceFilter, setPriceFilter] = useState(null);
  const [directOnly, setDirectOnly] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('flighthacked_result');
    if (!stored) {
      toast.error('No results found. Please start a new search.');
      router.push(`/${lang}`);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setResults(parsed.results || []);
      setRouteInfo({ from: parsed.from });
    } catch {
      toast.error('Error parsing results.');
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
      setResults(data.results || []);
      setRouteInfo({ from: data.from });
    } catch {
      toast.error('Failed to regenerate suggestions.');
    } finally {
      setRegenerating(false);
    }
  };

  const filterFlights = (flights) => {
    return flights.filter((flight) => {
      const price = parseFloat(flight.price?.replace(/[^\d.]/g, '')) || 0;
      const passesPrice = !priceFilter || price <= priceFilter;
      const passesDirect = !directOnly || flight.stops === 0;
      return passesPrice && passesDirect;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center text-lg">
        {t.loading || 'Fetching travel packages...'}
      </div>
    );
  }

  // ─── Group results by destination ─────────────────────────────
  const groupedByDestination = results.reduce((acc, entry) => {
    if (!entry.destination) return acc;
    if (!acc[entry.destination]) acc[entry.destination] = [];
    acc[entry.destination].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-4xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6 text-[#007BFF]">
        {t.tripSummary || 'Your trip options'}
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6 text-sm">
        <label>
          💰 Max Price:{' '}
          <input
            type="number"
            placeholder="e.g. 800"
            className="px-2 py-1 border rounded text-black"
            onChange={(e) => setPriceFilter(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(e) => setDirectOnly(e.target.checked)}
          />
          ✈️ Direct Flights Only
        </label>
      </div>

      {/* Grouped Results */}
      {Object.entries(groupedByDestination).map(([destination, trips], idx) => (
        <div key={idx} className="mb-12">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">
            ✈️ {routeInfo.from} → {destination}
          </h2>

          {trips.map(({ departDate, returnDate, options }, i) => {
            if (!options?.length) return null;

            // Normalize data
            const cleanFlights = options.map((f) => ({
              ...f,
              _price: parseFloat(f.price?.replace(/[^\d.]/g, '')) || 999999,
              _durationMinutes: parseInt(f.duration?.match(/\d+/)?.[0]) || 9999,
              stops: f.stops ?? 0,
              airline: f.airline || 'Unknown',
            }));

            const sorted = cleanFlights.sort((a, b) => a._price - b._price);
            const bestValue = sorted[0];
            const fastest = sorted.reduce((a, b) =>
              a._durationMinutes < b._durationMinutes ? a : b
            );

            const filtered = sorted.filter((flight) => {
              const passesPrice = !priceFilter || flight._price <= priceFilter;
              const passesDirect = !directOnly || flight.stops === 0;
              return passesPrice && passesDirect;
            });

            if (!filtered.length) return null;

            return (
              <div key={i} className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  📅 {departDate} → {returnDate}
                </h3>
                <div className="space-y-4">
                  {filtered.map((flight, index) => {
                    const isBestValue = flight === bestValue;
                    const isFastest = flight === fastest;
                    const isRecommended = isBestValue && isFastest;

                    return (
                      <div
                        key={index}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-lg shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.01]"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-bold text-blue-600">
                            {routeInfo.from} → {destination}
                          </span>
                          <span>
                            {flight.stops === 0 ? '🟢 Direct' : '🛑 Layover'}
                          </span>
                        </div>

                        <p className="text-sm mb-1">
                          <strong>Price:</strong> {flight.price}{' '}
                          {isRecommended && (
                            <span className="bg-purple-200 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded ml-2">
                              ⭐ Recommended
                            </span>
                          )}
                          {!isRecommended && isBestValue && (
                            <span className="bg-green-200 text-green-800 text-xs font-semibold px-2 py-0.5 rounded ml-2">
                              💰 Best Value
                            </span>
                          )}
                        </p>

                        <p className="text-sm mb-1">
                          <strong>Airline:</strong> {flight.airline}
                        </p>

                        {flight.duration && (
                          <p className="text-sm mb-1">
                            <strong>Duration:</strong> {flight.duration}{' '}
                            {!isRecommended && isFastest && (
                              <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded ml-2">
                                ⚡ Fastest
                              </span>
                            )}
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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Regenerate Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium text-slate-900 dark:text-white px-5 py-2 rounded transition disabled:opacity-50"
        >
          {regenerating ? t.regenerating || 'Regenerating...' : t.tryAgain || 'Try again'}
        </button>
      </div>

      {/* Start Over */}
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

      {/* Google Ads */}
      <div className="mt-10">
        <GoogleAds />
      </div>
    </div>
  );
}
