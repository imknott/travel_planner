'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient'; // adjust path as needed

const questions = [
    { key: 'name', prompt: "Hi! I’m your AI travel planner 👋 What’s your full name?" },
    { key: 'homeAirport', prompt: "Awesome! What city or airport do you usually fly out from?" },
    { key: 'interests', prompt: "What types of travel excite you? (e.g., hiking, cities, food, beaches)" },
    { key: 'bucketList', prompt: "Any dream destinations or countries on your bucket list?" },
    { key: 'style', prompt: "How would you describe your travel style? (luxury, budget, solo, family?)" },
];

export default function SetupWizard({ email, onComplete }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [input, setInput] = useState('');
    const [saving, setSaving] = useState(false);

    const MIN_STEP_TIME_MS = 1200;

    const handleNext = async () => {
        if (!input.trim()) return;

        const currentQ = questions[step];
        const start = Date.now();

        // Make API call
        const res = await fetch('/api/parse-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: input, key: currentQ.key }),
        });

        const parsed = await res.json();
        const nextAnswers = { ...answers, ...parsed };

        // Wait until minimum step time has passed
        const elapsed = Date.now() - start;
        if (elapsed < MIN_STEP_TIME_MS) {
            await new Promise((resolve) => setTimeout(resolve, MIN_STEP_TIME_MS - elapsed));
        }

        setAnswers(nextAnswers);
        setInput('');

        if (step + 1 < questions.length) {
            setStep(step + 1);
        } else {
            setSaving(true);
            await setDoc(doc(db, 'users', email), {
                ...nextAnswers,
                email,
                createdAt: new Date(),
            });
            onComplete();
        }
    };


    const currentPrompt = questions[step].prompt;

    return (
        <div className="max-w-xl mx-auto mt-24 px-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <p className="text-md mb-4">{currentPrompt}</p>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    className="w-full border px-3 py-2 rounded dark:bg-slate-700 dark:text-white"
                    placeholder="Type your response…"
                    autoFocus
                />
                <button
                    onClick={handleNext}
                    className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    {saving ? 'Saving...' : 'Next'}
                </button>
            </div>
        </div>
    );
}
