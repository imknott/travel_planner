import admin from 'firebase-admin';

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.applicationDefault(), // uses Cloud Run's service account
    });

export const db = app.firestore();
