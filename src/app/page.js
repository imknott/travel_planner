'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { translations } from '@/lib/translations';

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [from, setFrom] = useState('');
  const router = useRouter();

  const t = translations[lang] || translations['en'];

  useEffect(() => {
    const savedLang = localStorage.getItem('flighthacked_lang');
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
      return;
    }

    const browserLang = navigator.language.slice(0, 2);
    if (translations[browserLang]) {
      setLang(browserLang);
      localStorage.setItem('flighthacked_lang', browserLang);
    } else {
      setLang('en');
    }
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input, from }),
      });

      const text = await res.text();
      const data = JSON.parse(text);
      const assistantResponse = data.result || data;

      sessionStorage.setItem('flighthacked_result', assistantResponse);
      sessionStorage.setItem('flighthacked_input', input);
      sessionStorage.setItem('flighthacked_from', from);
      toast.success('Flights found! Redirecting…');
      router.push('/results');
    } catch (error) {
      console.error('Fetch or JSON error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Hero Section */}
      <section
        className="relative h-[85vh] bg-cover bg-center flex items-center justify-center px-2"
        style={{ backgroundImage: `url('/pexels-nappy-1058959.jpg')` }}
      >
        <div className="bg-black/70 p-8 rounded-lg shadow-lg text-center text-white w-full max-w-2xl mt-24">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">{t.tagline}</h1>

          {/* ✈️ Input section with FROM field */}
          <div className="flex flex-col gap-2 mb-2">
            <input
              className="p-3 rounded bg-white text-black placeholder-gray-500"
              type="text"
              placeholder="Where are you flying from?"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={loading}
            />
            <input
              className="p-3 rounded bg-white text-black placeholder-gray-500"
              type="text"
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? t.loading : t.search}
            </button>
          </div>

          {/* 🎯 Quiz link and loader */}
          <div className="mt-4">
            <a href="/quiz" className="text-sm text-blue-200 hover:text-white hover:underline">
              {t.quiz}
            </a>
          </div>
          {loading && (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white" />
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-100 py-10 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg mb-6">
            {t.tagline}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
            {t.features.map((feature, index) => (
              <span key={index} className="bg-white px-4 py-2 rounded shadow">
                {feature}
              </span>
            ))}
          </div>
          <div className="mt-6 text-sm text-gray-500">
            {t.popular}
          </div>
        </div>
      </section>

      {/* Results */}
      <main className="max-w-3xl mx-auto mt-10 p-4">
        {result && (
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{result}</pre>
        )}
      </main>
      
    </div>
  );
}
