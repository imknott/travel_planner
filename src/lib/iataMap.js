import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

export async function mapToIATA(cityName) {
  if (!cityName) return null;

  const normalized = cityName.trim().toLowerCase();
  const docRef = db.collection('iata_cache').doc(normalized);
  const cached = await docRef.get();

  if (cached.exists) {
    return cached.data().iata;
  }

  const csvPath = path.resolve(process.cwd(), 'public/airports.csv');

  const iata = await new Promise((resolve, reject) => {
    let found = null;
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const city = row['municipality']?.toLowerCase();
        const iata = row['iata_code'];
        const type = row['type'];

        if (!found && city === normalized && iata && type === 'large_airport') {
          found = iata;
        }
      })
      .on('end', () => resolve(found))
      .on('error', reject);
  });

  if (iata) {
    await docRef.set({ iata, updatedAt: new Date().toISOString() });
  }

  return iata || null;
}
