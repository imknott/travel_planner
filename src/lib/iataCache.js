import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp(); // Uses GCP credentials automatically
}

const db = admin.firestore();

export async function getCachedCityCode(city) {
  const ref = db.collection('iataCodes').doc(city.toLowerCase());
  const snapshot = await ref.get();
  return snapshot.exists ? snapshot.data().code : null;
}

export async function saveCityCode(city, code) {
  const ref = db.collection('iataCodes').doc(city.toLowerCase());
  await ref.set({ code }, { merge: true });
}
