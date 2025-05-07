'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import GoogleAds from '@/components/googleAds';

const questions = [
  {
    id: 'group',
    question: 'Who are you traveling with?',    options: ['Solo', 'Couple', 'Family with children', 'Friends', 'Partner or spouse', 'Other']
  },
  {
    id: 'continent',
    question: 'What region are you most interested in?',
    options: ['Europe', 'Asia', 'South America', 'Anywhere!'],
    background: true
  },
  {
    id: 'budget',
    question: 'What’s your ideal flight budget?',
    options: ['<$300', '$300-$500', '$500-$800', 'No limit']
  },
  {
    id: 'season',
    question: 'When do you want to travel?',
    options: ['Spring', 'Summer', 'Fall', 'Winter'],
    background: true
  },
  {
    id: 'vibe',
    question: 'What kind of trip are you looking for?',
    options: ['Adventure', 'Relaxation', 'City life', 'Cultural', 'Remote/nature'],
    background: true
  },
  {
    id: 'features',
    question: 'What features are important in your destination?',
    type: 'multi',
    options: [
      'LGBTQ+ friendly',
      'Culturally rich',
      'Historical landmarks',
      'Diverse communities',
      'Easy public transit',
      'Safe overall',
      'Disability accessible',
      'Solo female travel safe',
      'Nightlife & social scene',
      'Nature & outdoors',
      'Foodie destination',
    ],
  },
  {
    id: 'visa',
    question: 'Do you have any visa/passport restrictions?',
    options: ['No restrictions', 'US passport only', 'EU passport only', 'Need visa-free destinations', 'Other/complicated'],
  }
];

function generateTravelPrompt(answers) {
  return `
You're a travel advisor helping someone plan their next trip. Recommend 3 travel destinations that meet the following:

- Traveler type: ${answers.group}
- Region: ${answers.continent}
- Budget: ${answers.budget}
- Season: ${answers.season}
- Trip vibe: ${answers.vibe}
- Important features: ${answers.features?.join(', ') || 'None'}
- Visa/passport restrictions: ${answers.visa}

Each destination should briefly explain why it fits these criteria, with attention to safety, accessibility, and cultural relevance.
`;
}

const optionBackgrounds = {
  Europe: '/images/europe.jpg',
  Asia: '/images/asia.jpg',
  'South America': '/images/southAmerica.jpg',
  'Anywhere!': '/images/global.jpg',
  Spring: '/images/spring.jpg',
  Summer: '/images/summer.jpg',
  Fall: '/images/fall.jpg',
  Winter: '/images/winter.jpg',
  Adventure: '/images/adventure.jpg',
  Relaxation: '/images/chill.jpg',
  'City life': '/images/city.jpg',
  Cultural: '/images/cultural.jpg',
  'Remote/nature': '/images/remote_nature.jpg',
};

export default function QuizPage() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});
  const router = useRouter();

  const current = questions[step];
  const isComplete = step >= questions.length;

  useEffect(() => {
    Object.values(optionBackgrounds).forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => setLoadedImages((prev) => ({ ...prev, [src]: true }));
    });
  }, []);

  const handleSelect = (value) => {
    if (current.type === 'multi') {
      const selected = answers[current.id] || [];
      const updated = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      setAnswers({ ...answers, [current.id]: updated });
    } else {
      setAnswers({ ...answers, [current.id]: value });
      setStep(step + 1);
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleRestart = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-10 relative overflow-hidden">
      <div className="relative max-w-xl mx-auto text-center space-y-6 z-10">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <h1 className="text-xl font-semibold">{current.question}</h1>

              {current.type === 'multi' ? (
                <>
                  <div className="flex flex-wrap justify-center gap-2">
                    {current.options.map((opt) => {
                      const selected = (answers[current.id] || []).includes(opt);
                      return (
                        <motion.button
                          key={opt}
                          onClick={() => handleSelect(opt)}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            selected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white'
                          }`}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleNext}
                    className="mt-6 px-4 py-2 text-sm text-blue-500 hover:underline"
                  >
                    Next
                  </button>
                </>
              ) : current.background ? (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {current.options.map((opt) => {
                    const selected = answers[current.id] === opt;
                    const bg = optionBackgrounds[opt];
                    const isLoaded = loadedImages[bg];

                    return (
                      <div key={opt} className="relative h-36">
                        <button
                          onClick={() => handleSelect(opt)}
                          className={`absolute inset-0 w-full h-full rounded overflow-hidden group border-2 transition ${
                            selected ? 'border-blue-600' : 'border-transparent'
                          }`}
                          style={{
                            backgroundImage: `url(${bg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />
                          <span className="relative z-10 text-white font-semibold text-lg">{opt}</span>
                        </button>
                        {!isLoaded && (
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse rounded" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {current.options.map((opt) => {
                    const selected = answers[current.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className={`px-4 py-3 rounded-lg font-medium text-sm transition ${
                          selected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-xl font-bold">Your Travel Preferences</h1>
              <div className="text-left bg-white dark:bg-slate-800 p-4 rounded shadow mt-4 space-y-2">
                {Object.entries(answers).map(([key, val]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {Array.isArray(val) ? val.join(', ') : val}
                  </p>
                ))}
              </div>
              <button
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  const prompt = generateTravelPrompt(answers);
                  sessionStorage.setItem('flighthacked_input', prompt);
                  router.push('/results');
                }}
              >
                Generate Results →
              </button>
              <div className="mt-3">
                <button onClick={handleRestart} className="text-sm underline text-blue-400">
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <GoogleAds></GoogleAds>
    </div>
  );
}
