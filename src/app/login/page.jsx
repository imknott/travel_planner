'use client';

import { useState } from 'react';
import {
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [step, setStep] = useState('login'); // login | emailSent | phoneSent | verifyingSMS
  const router = useRouter();

  const saveUser = async (user) => {
    const ref = doc(db, 'users', user.uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
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
  };

  const handleGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUser(result.user);
    router.push('/profile');
  };

  const handlePhone = async () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
      }, auth);
    }

    const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    setVerificationId(confirmation.verificationId);
    setStep('verifyingSMS');
  };

  const verifySmsCode = async () => {
    const cred = auth.PhoneAuthProvider.credential(verificationId, smsCode);
    const result = await auth.signInWithCredential(cred);
    await saveUser(result.user);
    router.push('/profile');
  };

  const sendEmailLink = async () => {
    const actionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    setStep('emailSent');
  };

  const checkEmailSignIn = async () => {
    const storedEmail = window.localStorage.getItem('emailForSignIn');
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      await saveUser(result.user);
      router.push('/profile');
    }
  };

  // Check for magic link sign-in
  useState(() => {
    checkEmailSignIn();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-24 p-6 bg-white dark:bg-slate-800 rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-center">Sign in</h1>

      {/* Google Sign In */}
      <button
        onClick={handleGoogle}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Sign in with Google
      </button>

      {/* Divider */}
      <div className="border-t pt-4 text-center text-sm text-slate-500">or</div>

      {/* Phone Sign In */}
      <div className="space-y-3">
        <input
          type="tel"
          placeholder="Phone (e.g. +1234567890)"
          className="w-full p-2 border rounded dark:bg-slate-700"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          onClick={handlePhone}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Send SMS Code
        </button>
        {step === 'verifyingSMS' && (
          <>
            <input
              type="text"
              placeholder="Enter verification code"
              className="w-full p-2 border rounded dark:bg-slate-700"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
            />
            <button
              onClick={verifySmsCode}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Verify & Sign In
            </button>
          </>
        )}
        <div id="recaptcha-container"></div>
      </div>

      {/* Divider */}
      <div className="border-t pt-4 text-center text-sm text-slate-500">or</div>

      {/* Email Sign In */}
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded dark:bg-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={sendEmailLink}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Send Magic Link
        </button>
        {step === 'emailSent' && (
          <p className="text-xs text-slate-500">Check your inbox for the sign-in link.</p>
        )}
      </div>
    </div>
  );
}
