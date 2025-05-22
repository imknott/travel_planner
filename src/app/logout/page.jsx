'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { signOut, getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(); // ✅ inside useEffect = safe
    signOut(auth).finally(() => {
      router.push('/');
    });
  }, [router]);

  return (
    <div className="pt-24 text-center text-lg">
      Logging you out...
    </div>
  );
}
