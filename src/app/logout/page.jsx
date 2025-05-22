'use client';
import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    signOut(auth).finally(() => {
      router.push('/');
    });
  }, [router]);

  return (
    <div className="pt-24 text-center">
      <p className="text-lg">Signing you out...</p>
    </div>
  );
}
