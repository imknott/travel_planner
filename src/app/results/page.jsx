'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import TravelInsuranceAd from '@/components/TravelInsuranceAd';

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [routeInfo, setRouteInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('flighthacked_result');
    if (!stored) {
      toast.error('No results found. Please start a new search.');
      router.push(`/`);
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
      router.push(`/`);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const formatMoney = (amount) =>
    `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center text-lg">
        Fetching travel packages…
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-4xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6 text-[#007BFF]">
        Your travel packages
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
          attractions,
          totalCost,
          perPersonCost,
        } = pkg;

        const flight = flights?.[0];
        const hotel = hotels?.[0];

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
                  <strong>Flight:</strong> {flight.airline || 'N/A'} · {flight.duration || 'N/A'} · {flight.stops === 0 ? 'Direct' : 'Layover'} ·{' '}
                  <span className="font-semibold">{flight.price}</span> × {travelers} travelers
                </p>
              </div>
            )}

            {hotel && (
              <div className="mt-3">
                <p className="text-sm">
                  <strong>Hotel:</strong> {hotel.name} · {hotel.price} {hotel.currency} · {Math.ceil(travelers / 2)} room(s)
                </p>
              </div>
            )}

            {attractions?.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-1">Top attractions:</p>
                <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                  {attractions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
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
        <TravelInsuranceAd />
      </div>
    </div>
  );
}
