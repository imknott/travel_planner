import React from 'react';
import { fuzzyAirlineWebsiteMap } from './fuzzy_airline_links';
import { canonicalAirlineMap } from './canonicalAirlineMapper.js';

const pillColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-rose-100 text-rose-800',
];

const normalize = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

export function linkifyAirlinesWithPills(rawText) {
  // ✅ Guard against non-string input
  if (typeof rawText !== 'string') {
    console.warn('[linkifyAirlinesWithPills] Received non-string input:', rawText);
    return {
      jsx: <p className="mb-2">[Invalid response]</p>,
      hasMultipleAirlines: false,
    };
  }

  let text = rawText.replace(/book here:.*?(https?:\/\/[^\s)]+)/gi, '');
  const elements = [];
  const matchedCanonicals = new Set();
  let remaining = text;
  let colorIndex = 0;

  // Build alias-to-canonical mapping
  const aliasToCanonical = {};
  Object.entries(canonicalAirlineMap).forEach(([slug, aliases]) => {
    aliases.forEach((alias) => {
      aliasToCanonical[normalize(alias)] = slug;
    });
  });

  // Sort aliases for greedy matching
  const sortedAliases = Object.keys(fuzzyAirlineWebsiteMap).sort(
    (a, b) => b.length - a.length
  );

  while (remaining.length > 0) {
    let matched = false;

    for (const alias of sortedAliases) {
      const regex = new RegExp(`(^|[^a-zA-Z])(${alias})([^a-zA-Z]|$)`, 'i');
      const match = remaining.match(regex);

      if (match && match.index !== undefined) {
        const [fullMatch, before, actualName] = match;
        const index = match.index + before.length;
        const aliasSlug = normalize(actualName);
        const canonicalSlug = aliasToCanonical[aliasSlug] || aliasSlug;

        // ✅ Skip if already rendered
        if (matchedCanonicals.has(canonicalSlug)) continue;

        if (index > 0) {
          elements.push(remaining.slice(0, index));
        }

        const url =
          fuzzyAirlineWebsiteMap[alias] +
          '?utm_source=flighthacked&utm_medium=referral';
        const color = pillColors[colorIndex % pillColors.length];

        elements.push(
          <a
            key={`${canonicalSlug}-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${color} hover:underline mx-1`}
          >
            {actualName}
          </a>
        );

        matchedCanonicals.add(canonicalSlug);
        colorIndex++;
        remaining = remaining.slice(index + actualName.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      elements.push(remaining);
      break;
    }
  }

  return {
    jsx: <p className="mb-2">{elements}</p>,
    hasMultipleAirlines: matchedCanonicals.size > 1,
  };
}
