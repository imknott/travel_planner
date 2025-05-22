import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export async function POST(req) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decoded.uid);

    const userRef = db.collection('users').doc(user.uid);
    const existing = await userRef.get();

    if (!existing.exists) {
      await userRef.set({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        phone: user.phoneNumber || '',
        homeAirport: '',
        interests: [],
        sex: '',
        genderIdentity: '',
        bucketListDestinations: [],
        countriesTraveled: [],
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ /api/login failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
