'use client';

import { signInWithPopup } from 'firebase/auth';
import { auth, provider, db } from '/lib/firebaseClient';


export default function SignInButton() {
  const handleLogin = async () => {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const ref = doc(db, 'users', user.uid);
    const docSnap = await getDoc(ref);

    if (!docSnap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
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

    alert(`Welcome, ${user.displayName || user.email}!`);
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Sign in with Google
    </button>
  );
}
