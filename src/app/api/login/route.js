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

    // 1. Verify the token and get user data
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await admin.auth().getUser(decoded.uid);

    // 2. Format minimal profile
    const profile = {
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
    };

    const userRef = db.collection('users').doc(user.uid);
    const existing = await userRef.get();

    if (!existing.exists) {
      await userRef.set(profile);
    } else {
      // Optionally update email/name if changed
      await userRef.set(
        { email: user.email || '', name: user.displayName || '', phone: user.phoneNumber || '' },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true, user: { uid: user.uid, email: user.email } });
  } catch (err) {
    console.error('❌ /api/login failed:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
