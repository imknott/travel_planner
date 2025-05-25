'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/navbar';

export default function ClientOnlyLayout({ children }) {
  const pathname = usePathname();

  const isPublicPage = pathname === '/login' || pathname === '/logout';

  return isPublicPage ? (
    <>
      <Navbar />
      {children}
    </>
  ) : (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
