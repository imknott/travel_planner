// src/components/ImageCarousel.jsx
'use client';

import React, { useState } from 'react';

export default function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;

  const prev = () => setIdx(i => (i - 1 + count) % count);
  const next = () => setIdx(i => (i + 1) % count);

  if (count === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <img
        src={images[idx]}
        alt={`Slide ${idx + 1}`}
        className="w-full h-64 object-cover"
      />

      {/* Prev/Next */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
      >
        ›
      </button>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
        {images.map((_, i) => (
          <span
            key={i}
            className={`block w-2 h-2 rounded-full ${
              i === idx ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}
