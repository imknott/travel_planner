'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { translations } from '@/lib/translations';
import { linkifyAirlinesWithPills } from '@/lib/utils'; // updated import
import GoogleAds from '@/components/googleAds';

export default function ResultsPage() {
  const router = useRouter();
  const [resultText, setResultText] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [refinedDates, setRefinedDates] = useState({});
  const [loadingDates, setLoadingDates] = useState({});
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('flighthacked_lang');
    if (storedLang) setLang(storedLang);

    const stored = sessionStorage.getItem('flighthacked_result');
    if (!stored) {
      toast.error('No results found. Please start a new search.');
      router.push('/');
    } else {
      setResultText(stored);
    }
  }, [router]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    const input = sessionStorage.getItem('flighthacked_input');
    const from = sessionStorage.getItem('flighthacked_from');

    if (!input) {
      toast.error('Missing previous search input.');
      setRegenerating(false);
      return;
    }

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input, from }),
      });

      const data = await res.json();
      setResultText(data.result || '');
      sessionStorage.setItem('flighthacked_result', data.result || '');
    } catch (error) {
      toast.error('Failed to regenerate suggestions.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRefineDates = async (cardIndex, cardText) => {
    setLoadingDates((prev) => ({ ...prev, [cardIndex]: true }));

    try {
      const res = await fetch('/api/refinedates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardText }),
      });

      const data = await res.json();
      setRefinedDates((prev) => ({ ...prev, [cardIndex]: data.dates }));
    } catch (err) {
      toast.error('Could not refine dates for this trip.');
    } finally {
      setLoadingDates((prev) => ({ ...prev, [cardIndex]: false }));
    }
  };

  if (!resultText) return null;
  const t = translations[lang] || translations['en'];

  const cards = resultText
    .split(/\d\.\s|✈️/)
    .map((card) => card.trim())
    .filter((card) => card.length > 0);

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-3xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6 text-[#007BFF]">{t.tripSummary}</h1>

      <div className="space-y-6">
        {cards.map((card, index) => {
          const { jsx, hasMultipleAirlines } = linkifyAirlinesWithPills(card);

          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-lg shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.01]"
            >
              <h2 className="text-lg font-semibold mb-2 text-[#007BFF]">
                ✈️ {t.tripOption || 'Trip Option'} {index + 1}
              </h2>

              <div className="text-sm leading-relaxed space-y-2">{jsx}</div>

              {hasMultipleAirlines && (
                <span className="inline-block mt-2 text-xs text-yellow-700 bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                  🧩 Multiple Airlines
                </span>
              )}

              <button
                onClick={() => handleRefineDates(index, card)}
                disabled={loadingDates[index]}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
              >
                {loadingDates[index]
                  ? 'Refining dates…'
                  : t.refineDates || 'Get exact travel dates'}
              </button>

              {refinedDates[index] && (
                <div className="mt-3 text-sm bg-blue-50 dark:bg-slate-700 p-2 rounded border border-blue-200 dark:border-slate-600">
                  📅 <strong>{t.suggestedDates || 'Suggested Dates'}:</strong>{' '}
                  {refinedDates[index]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regenerate Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium text-slate-900 dark:text-white px-5 py-2 rounded transition disabled:opacity-50"
        >
          {regenerating
            ? t.regenerating || 'Regenerating...'
            : t.tryAgain || 'Not what you’re looking for? Try again'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <a
          href="/"
          className="inline-block px-5 py-2 bg-[#007BFF] hover:bg-[#005fcc] text-white rounded transition text-sm"
        >
          🔁 {t.searchAgain || 'Search Again'}
        </a>
        <a
          href="#"
          className="inline-block px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition text-sm"
        >
          🛒 {t.bookFlights || 'Book Flights (Coming Soon)'}
        </a>
      </div>

      <div className="mt-10">
        <GoogleAds />
      </div>
    </div>
  );
}
