import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export async function getCachedHotelIds(city) {
  const ref = db.collection('hotelIds').doc(city.toLowerCase());
  const snap = await ref.get();
  return snap.exists ? snap.data().ids : null;
}

export async function saveHotelIds(city, ids) {
  const ref = db.collection('hotelIds').doc(city.toLowerCase());
  await ref.set({ ids }, { merge: true });
}
