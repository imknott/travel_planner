// lib/iataMap.js
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

// Fallback for the most-searched cities
const FALLBACK = {
  'paris': 'CDG',
  'london': 'LHR',
  'tokyo': 'NRT',
  'new york': 'JFK',
  'los angeles': 'LAX',
  // …add more as i need
};

export async function mapToIATA(cityName) {
  if (!cityName) return null;
  const normalized = cityName.trim().toLowerCase();

  // 1) Firestore cache (as before)…
  const docRef = db.collection('iata_cache').doc(normalized);
  const cached = await docRef.get();
  if (cached.exists) return cached.data().iata;

  // 2) CSV lookup
  const csvPath = path.resolve(process.cwd(), 'public/airports.csv');
  let found = null;
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', row => {
        if (
          !found &&
          row['municipality']?.toLowerCase().trim() === normalized &&
          row['iata_code']
        ) {
          found = row['iata_code'];
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // 3) Fallback map
  const iata = found || FALLBACK[normalized] || null;

  // 4) Cache whichever you got
  if (iata) {
    await docRef.set({ iata, updatedAt: new Date().toISOString() });
  } else {
    console.warn(`[mapToIATA] No IATA code found for "${cityName}"`);
  }

  return iata;
}
