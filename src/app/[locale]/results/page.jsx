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
  const [budget, setBudget] = useState(null);

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
      setRouteInfo({
        from: parsed.from,
        travelers: parsed.travelers || 1,
        checkedBags: parsed.checkedBags || false,
        budget: parsed.budget || null,
      });
      if (parsed.budget) setBudget(Number(parsed.budget));
    } catch {
      toast.error('Error parsing results.');
      router.push(`/${lang}`);
    } finally {
      setLoading(false);
    }
  }, [router, lang]);

  const formatMoney = (amount) =>
    `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center text-lg">
        {t.loading || 'Fetching travel packages...'}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-4xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6 text-[#007BFF]">
        {t.tripSummary || 'Your travel packages'}
      </h1>

      {results.map((pkg, idx) => {
        const {
          from,
          destination,
          departDate,
          returnDate,
          travelers,
          checkedBags,
          flights,
          hotels,
          cars,
          totalCost,
          perPersonCost,
        } = pkg;

        const flight = flights?.[0];
        const hotel = hotels?.[0];
        const car = cars?.[0];

        const budgetNote = budget
          ? totalCost > budget
            ? `❌ $${totalCost} / $${budget} → $${totalCost - budget} over`
            : `✅ $${totalCost} / $${budget} → within budget`
          : `Total cost: ${formatMoney(totalCost)}`;

        return (
          <div
            key={idx}
            className="mb-10 border rounded-lg p-5 bg-white dark:bg-slate-800 shadow"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-blue-600">
                ✈ {from} → {destination}
              </h2>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {budgetNote}
              </span>
            </div>

            <p className="text-sm mb-1">
              <strong>Dates:</strong> {departDate} → {returnDate}
            </p>
            <p className="text-sm mb-1">
              <strong>Travelers:</strong> {travelers}
              {checkedBags ? ' · Includes checked bags' : ''}
            </p>

            {flight && (
              <div className="mt-3">
                <p className="text-sm">
                  <strong>Flight:</strong> {flight.airline} · {flight.duration}{' '}
                  · {flight.stops === 0 ? 'Direct' : 'Layover'} ·{' '}
                  <span className="font-semibold">{flight.price}</span> × {travelers} travelers
                </p>
                <a
                  href={flight.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Book Flight
                </a>
              </div>
            )}

            {hotel && (
              <div className="mt-3">
                <p className="text-sm">
                  <strong>Hotel:</strong> {hotel.name} · {hotel.price}/night ·{' '}
                  {Math.ceil(travelers / 2)} room(s)
                </p>
                <a
                  href={hotel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Book Hotel
                </a>
              </div>
            )}

            {car && (
              <div className="mt-3">
                <p className="text-sm">
                  <strong>Car:</strong> {car.company} · {car.price} total
                </p>
                <a
                  href={car.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Book Car
                </a>
              </div>
            )}

            <div className="mt-4 text-sm text-slate-700 dark:text-slate-300">
              <strong>Total cost:</strong> {formatMoney(totalCost)} ·{' '}
              <strong>Per person:</strong> {formatMoney(perPersonCost)}
            </div>
          </div>
        );
      })}

      <div className="mt-12">
        <GoogleAds />
      </div>
    </div>
  );
}
