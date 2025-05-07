'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { translations } from '@/lib/translations';
import { useLanguage } from '@/context/LanguageContext';


export default function Home() {
  const [input, setInput] = useState('');
  const [from, setFrom] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { lang, t, translate } = useLanguage();


  const handleSearch = async () => {
    setLoading(true);
    try {
      const fetchPromise = fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input, from }),
      })
        .then(res => res.text())
        .then(text => {
          const data = JSON.parse(text);
          return data.result || data;
        });

      const assistantResponse = await toast.promise(fetchPromise, {
        loading: 'Looking for flights…',
        success: 'Flights found! Redirecting…',
        error: 'Something went wrong. Please try again.',
      });

      sessionStorage.setItem('flighthacked_result', assistantResponse);
      sessionStorage.setItem('flighthacked_input', input);
      sessionStorage.setItem('flighthacked_from', from);
      router.push(`/${lang}/results`);
    } catch (error) {
      console.error('Fetch error:', error);
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

          {/* Inputs */}
          <div className="flex flex-col gap-3">
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
              className={`bg-[#007BFF] hover:bg-[#005fcc] text-white font-semibold px-4 py-3 rounded transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? t.loading : t.search}
            </button>
          </div>

          {/* Quiz Link + Spinner */}
          <div className="mt-4">
            <a href={`/${lang}/quiz`} className="text-sm text-blue-300 hover:text-white hover:underline">
              {t.quiz}
            </a>
            {loading && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white" />
              </div>
            )}
          </div>
        </div>
      </section>

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

      {/* Result Preview */}
      <main className="max-w-3xl mx-auto mt-10 p-4">
        {result && (
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </main>
    </div>
  );
}
