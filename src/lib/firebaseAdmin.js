import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Uses Cloud Run service account
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
