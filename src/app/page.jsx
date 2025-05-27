'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200">
      {/* Hero Section with Background Video */}
      <section className="relative h-[75vh] flex items-center justify-center px-2 overflow-hidden">
        {/* Video (only on desktop) */}
        <div className="hidden sm:block absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/images/2547258-Uhd 3840 2160 30Fps.webm" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Fallback image for mobile */}
        <div
          className="block sm:hidden absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/images/travel_mobile_fallback.jpg')" }}
        />

        {/* Overlay for readability */}
        <div className="absolute inset-0  z-10" />

        {/* Foreground content */}
        <div className="relative z-20 p-8 rounded-lg shadow-lg text-center w-full max-w-2xl mt-24 text-white">
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
              className={`bg-[#519d58cc] hover:bg-[#91eabc] text-white font-semibold px-4 py-3 rounded transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search travel deals'}
            </button>
          </div>
        </div>
      </section>


      {/* Feature Section */}
      <section className="bg-white/80 py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl font-medium mb-6">
            We help build you the perfect travel itinerary! With the power of machine learning we personalize your results.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            {[
              'One search, all options',
              'AI-powered travel planning',
              'Flight + Hotel bundles',
              'Price-aware, date-flexible',
              'Works worldwide',
            ].map((feature, index) => (
              <span key={index} className="bg-white dark:bg-slate-700 px-4 py-2 rounded shadow">
                {feature}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Try "I want a hotel in Paris in June" or "Flight to Tokyo with a car rental"
          </p>
        </div>
      </section>
    </div>
  );
}
