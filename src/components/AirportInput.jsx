'use client';
import { useEffect, useRef, useState } from 'react';

export default function AirportInput({ value, onSelect }) {
  const [input, setInput] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google) return;
    autocompleteRef.current = new window.google.maps.places.AutocompleteService();
  }, []);

  useEffect(() => {
    if (input.length < 2 || !autocompleteRef.current) {
      setSuggestions([]);
      return;
    }

    autocompleteRef.current.getPlacePredictions(
      {
        input,
        types: ['(regions)'],
        // Filter keywords: match city+airport
        componentRestrictions: {}, // or use { country: 'us' }
      },
      (predictions, status) => {
        if (status === 'OK') {
          const filtered = predictions.filter(p => p.description.toLowerCase().includes('airport'));
          setSuggestions(filtered);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [input]);

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search home airport"
        className="w-full p-2 border rounded dark:bg-slate-700"
      />
      {suggestions.length > 0 && (
        <ul className="bg-white dark:bg-slate-700 border rounded mt-1 shadow z-50 relative">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="px-3 py-1 hover:bg-blue-100 dark:hover:bg-slate-600 cursor-pointer text-sm"
              onClick={() => {
                setInput(s.description);
                setSuggestions([]);
                onSelect(s.description);
              }}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
