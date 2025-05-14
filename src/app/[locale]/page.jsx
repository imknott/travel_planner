'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import TravelInsuranceAd from '@/components/TravelInsuranceAd';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { lang, t } = useLanguage();

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
        return data;      // <-- return full object, not just data.result
      });

      const responseData = await toast.promise(fetchPromise, {
        loading: 'Looking for travel deals…',
        success: 'Options found! Redirecting…',
        error: 'Something went wrong. Please try again.',
      });

      sessionStorage.setItem('flighthacked_result', JSON.stringify(responseData))
      sessionStorage.setItem('flighthacked_input', input);
      router.push(`/${lang}/results`);
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors duration-200">

      {/* Hero Section */}
      <section
        className="relative h-[75vh] bg-cover bg-center flex items-center justify-center px-2"
        style={{ backgroundImage: "url('/pexels-nappy-1058959.jpg')" }}
      >
        <div className="bg-black/70 dark:bg-black/80 p-8 rounded-lg shadow-lg text-center w-full max-w-2xl mt-24">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">{t.tagline}</h1>

          {/* Input */}
          <div className="flex flex-col gap-3">
            <input
              className="p-3 rounded bg-white text-black placeholder-gray-500"
              type="text"
              placeholder={t.placeholder || "e.g., I want a flight to Tokyo in August for 7 days with hotel"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              className={`bg-[#007BFF] hover:bg-[#005fcc] text-white font-semibold px-4 py-3 rounded transition ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              disabled={loading}
            >
              {loading ? t.loading : t.search}
            </button>
          </div>

          {/* Spinner */}
          <div className="mt-4">
            {loading && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white" />
              </div>
            )}
          </div>
        </div>
      </section>

      <TravelInsuranceAd />
      {/* About Section */}
      <section className="bg-slate-100 dark:bg-slate-800 py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl font-medium mb-6">{t.tagline}</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            {t.features.map((feature, index) => (
              <span key={index} className="bg-white dark:bg-slate-700 px-4 py-2 rounded shadow">
                {feature}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">{t.popular}</p>
        </div>
      </section>
    </div>
  );
}
