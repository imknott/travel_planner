// lib/iataMap.js
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

// Manually defined fallbacks for high-traffic cities
const FALLBACK = {
  // USA
  'new york': 'JFK',
  'new york city': 'JFK',
  'nyc': 'JFK',
  'los angeles': 'LAX',
  'la': 'LAX',
  'chicago': 'ORD',
  'boston': 'BOS',
  'san francisco': 'SFO',
  'sf': 'SFO',
  'seattle': 'SEA',
  'miami': 'MIA',
  'atlanta': 'ATL',
  'dallas': 'DFW',
  'houston': 'IAH',
  'washington': 'IAD',
  'dc': 'IAD',
  'orlando': 'MCO',
  'las vegas': 'LAS',
  'phoenix': 'PHX',
  'raleigh': 'RDU',
  "durham":'RDU',
  "raleigh-durham":'RDU',

  // Canada
  'toronto': 'YYZ',
  'vancouver': 'YVR',

  // Europe
  'london': 'LHR',
  'paris': 'CDG',
  'madrid': 'MAD',
  'rome': 'FCO',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'oslo': 'OSL',
  'copenhagen': 'CPH',
  'helsinki': 'HEL',

  // Asia
  'tokyo': 'NRT',
  'narita': 'NRT',
  'haneda': 'HND',
  'seoul': 'ICN',
  'incheon': 'ICN',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'hong kong': 'HKG',
  'bangkok': 'BKK',
  'delhi': 'DEL',
  'new delhi': 'DEL',
  'mumbai': 'BOM',
  'singapore': 'SIN',

  // Middle East & Africa
  'dubai': 'DXB',
  'doha': 'DOH',
  'cairo': 'CAI',
  'tel aviv': 'TLV',
  'johannesburg': 'JNB',
  'cape town': 'CPT',

  // South America
  'são paulo': 'GRU',
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG',
  'buenos aires': 'EZE',
  'mexico city': 'MEX',
};


export async function mapToIATA(cityName) {
  if (!cityName) return null;
  const normalized = cityName.trim().toLowerCase();

  // 1) Check Firestore cache first
  const docRef = db.collection('iata_cache').doc(normalized);
  const cached = await docRef.get();
  if (cached.exists) return cached.data().iata;

  // 2) Try searching the CSV database
  const csvPath = path.resolve(process.cwd(), 'public/airports.csv');
  let match = null;

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (match) return;

        const municipality = row['municipality']?.toLowerCase().trim();
        const iata = row['iata_code']?.toUpperCase();
        const name = row['name']?.toLowerCase().trim();
        const keywords = row['keywords']?.toLowerCase() || '';

        if (!iata) return;

        const matches =
          normalized === iata.toLowerCase() ||
          normalized === municipality ||
          name?.includes(normalized) ||
          keywords?.includes(normalized);

        if (matches) {
          match = iata;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // 3) Fallback hardcoded map
  const iata = match || FALLBACK[normalized] || null;

  // 4) Cache result
  if (iata) {
    await docRef.set({ iata, updatedAt: new Date().toISOString() });
  } else {
    console.warn(`[mapToIATA] No IATA found for: "${cityName}"`);
  }

  return iata;
}
