import { fuzzyAirlineWebsiteMap } from './fuzzy_airline_links';

const normalize = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

export function getAirlineUrl(rawName) {
  if (!rawName) return null;

  const slug = normalize(rawName);

  // Try exact match on normalized keys
  const exactMatch = Object.entries(fuzzyAirlineWebsiteMap).find(([key]) => normalize(key) === slug);
  if (exactMatch) return exactMatch[1];

  // Partial match fallback
  const partialMatch = Object.entries(fuzzyAirlineWebsiteMap).find(([key]) =>
    normalize(key).includes(slug) || slug.includes(normalize(key))
  );

  return partialMatch ? partialMatch[1] : null;
}