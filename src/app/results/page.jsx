'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import SetupWizard from '@/components/SetupWizard';
import FlightCard from '@/components/FlightCard';
import AttractionCard from '@/components/AttractionCard';
import TravelInsuranceAd from '@/components/TravelInsuranceAd';

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [routeInfo, setRouteInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [budget, setBudget] = useState(null);

  // Load search results
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

  const handleEmailSubmit = async () => {
    if (!email) return;
    const ref = doc(db, 'users', email);
    const snap = await getDoc(ref);
    setProfileExists(snap.exists());
    setEmailSubmitted(true);
  };

  const formatMoney = (amount) =>
    `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  if (!emailSubmitted) {
    return (
      <div className="min-h-screen pt-24 px-4 max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Welcome to FlightHacked ✈️</h2>
          <p className="text-sm mb-4">
            Before we show your results, have you searched with us before? Enter your email so I can check your travel profile:
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border px-3 py-2 rounded dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleEmailSubmit}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!profileExists) {
    return <SetupWizard email={email} onComplete={() => setProfileExists(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 text-center text-lg">
        Fetching travel packages…
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-4xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6 text-[#007BFF]">Your travel packages</h1>

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
          <div key={idx} className="mb-10 border rounded-lg p-5 bg-white dark:bg-slate-800 shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-blue-600">
                ✈ {from} → {destination}
              </h2>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{budgetNote}</span>
            </div>

            <p className="text-sm mb-1">
              <strong>Dates:</strong> {departDate} → {returnDate}
            </p>
            <p className="text-sm mb-1">
              <strong>Travelers:</strong> {travelers}
              {checkedBags ? ' · Includes checked bags' : ''}
            </p>

            {flight && <FlightCard flight={flight} travelers={travelers} />}

            {hotel && (
              <div className="mt-3 text-sm bg-slate-100 dark:bg-slate-700 p-4 rounded-md">
                <p className="font-semibold mb-1">Hotel:</p>
                <p>
                  🏨 <strong>{hotel.name}</strong>
                </p>
                <p>
                  💲 {formatMoney(hotel.price)} {hotel.currency} · {Math.ceil(travelers / 2)} room(s)
                </p>
              </div>
            )}

            {attractions?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Top attractions:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attractions.map((item, i) => (
                    <AttractionCard
                      key={i}
                      name={item.name}
                      image={item.image}
                      description={item.description}
                    />
                  ))}
                </div>
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
