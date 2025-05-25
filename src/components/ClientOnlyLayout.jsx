'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';
import { AuthProvider } from '@/context/AuthContext';

export default function ClientOnlyLayout({ children }) {
  const pathname = usePathname();
  const isPublic = pathname === '/login' || pathname === '/logout';

  return (
    <>
      <Navbar />
      {isPublic ? children : <AuthProvider>{children}</AuthProvider>}
    </>
  );
}
