'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const funFacts = [
  'The world’s shortest commercial flight is just 57 seconds long (in Scotland).',
  'The Boeing 747 can carry up to 63,000 gallons of fuel.',
  'Pilots and co-pilots eat different meals to avoid food poisoning.',
  'The longest non-stop commercial flight is over 18 hours long.',
  'Airplane tires are designed to withstand 38 tons and 200 mph landings.'
];

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const router = useRouter();

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 5000);

    try {
      const fetchPromise = fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unknown server error');
        return data;
      });

      const responseData = await toast.promise(fetchPromise, {
        loading: 'Looking for travel deals…',
        success: 'Options found! Redirecting…',
        error: 'Something went wrong. Please try again.',
      });

      sessionStorage.setItem('flighthacked_result', JSON.stringify(responseData));
      sessionStorage.setItem('flighthacked_input', input);
      router.push(`/results`);
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative h-[75vh] bg-cover bg-center flex items-center justify-center px-2" style={{ backgroundImage: "url('/pexels-nappy-1058959.jpg')" }}>
        <div className="bg-black/70 dark:bg-black/80 p-8 rounded-lg shadow-lg text-center w-full max-w-2xl mt-24">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">Plan smarter. Travel cheaper.</h1>

          <div className="flex flex-col gap-3">
            <input
              className="p-3 rounded bg-white text-black placeholder-gray-500"
              type="text"
              placeholder={'e.g., I want a flight to Tokyo in August for 7 days with hotel'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              className={`bg-[#007BFF] hover:bg-[#005fcc] text-white font-semibold px-4 py-3 rounded transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search travel deals'}
            </button>
          </div>

          {/* Animated Plane + Loader */}
          {loading && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-24 h-24 relative">
                <img src="https://media.giphy.com/media/DuJmk1yRUd1Di/giphy.gif" alt="Spinning Earth" className="w-full h-full rounded-full border-4 border-white shadow-lg" />
                <img src="/images/airliner-8886817.svg" alt="Plane" className="absolute top-1 left-1 w-6 h-6 animate-fly" />
              </div>
              <p className="mt-4 text-sm text-white animate-pulse">Loading travel magic…</p>
              <p className="mt-2 text-xs text-gray-300">✈ {funFacts[factIndex]}</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-100 dark:bg-slate-800 py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl font-medium mb-6">Find cheap flights, hotels, and car rentals in seconds — just tell us what you want.</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            {['One search, all options', 'AI-powered travel planning', 'Flight + Hotel + Car bundles', 'Price-aware, date-flexible', 'Works worldwide'].map((feature, index) => (
              <span key={index} className="bg-white dark:bg-slate-700 px-4 py-2 rounded shadow">
                {feature}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Try "I want a hotel in Paris in June" or "Flight to Tokyo with a car rental"</p>
        </div>
      </section>
    </div>
  );
}