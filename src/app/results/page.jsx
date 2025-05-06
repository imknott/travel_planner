'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { translations } from '@/lib/translations';
import { linkifyAirlines } from '@/lib/utils';
import GoogleAds from '@/components/googleAds';

export default function ResultsPage() {
    const router = useRouter();
    const [resultText, setResultText] = useState('');
    const [regenerating, setRegenerating] = useState(false);
    const [refinedDates, setRefinedDates] = useState({});
    const [loadingDates, setLoadingDates] = useState({});

    const [lang, setLang] = useState('en');

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


    useEffect(() => {
        const storedLang = localStorage.getItem('flighthacked_lang');
        if (storedLang) setLang(storedLang);

        const stored = sessionStorage.getItem('flighthacked_result');
        if (!stored) {
            toast.error('No results found. Please start a new search.');
            router.push('/');
            return;
        }

        setResultText(stored);
    }, [router]);

    if (!resultText) return null;

    const t = translations[lang] || translations['en'];

    // ✅ Split results into individual trip cards
    const cards = resultText
        .split(/\d\.\s|✈️/)
        .map((card) => card.trim())
        .filter((card) => card.length > 0);

    return (
        <div className="min-h-screen pt-32 px-4 pb-10 max-w-3xl mx-auto text-gray-900">
            <h1 className="text-2xl font-bold mb-6">
                {t.tripSummary || 'Trip Ideas Based on Your Preferences'}
            </h1>

            <div className="space-y-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white p-4 rounded shadow border border-gray-200 transition-transform hover:scale-[1.02] hover:shadow-lg duration-200"
                    >
                        <h2 className="text-lg font-semibold mb-2">✈️ Trip Option {index + 1}</h2>
                        {linkifyAirlines(card)}

                        <button
                            onClick={() => handleRefineDates(index, card)}
                            className="mt-3 text-sm text-blue-600 underline hover:text-blue-800"
                            disabled={loadingDates[index]}
                        >
                            {loadingDates[index] ? 'Refining dates...' : 'Get exact travel dates'}
                        </button>

                        {refinedDates[index] && (
                            <div className="mt-3 text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                📅 <strong>Suggested Dates:</strong> {refinedDates[index]}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={handleRegenerate}
                className="mt-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
                disabled={regenerating}
            >
                {regenerating ? 'Regenerating...' : 'Not what you’re looking for? Try again'}
            </button>

            <div className="flex gap-4 mt-6">
                <a
                    href="/"
                    className="inline-block px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    🔁 {t.searchAgain || 'Search Again'}
                </a>
                <a
                    href="#"
                    className="inline-block px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    🛒 {t.bookFlights || 'Book Flights (Coming Soon)'}
                </a>
            </div>

            <GoogleAds />
        </div>
    );
}
