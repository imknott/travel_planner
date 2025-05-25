'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import NavbarBase from '@/components/NavbarBase';
import NavbarWithAuth from '@/components/NavbarWithAuth';

export default function ClientOnlyLayout({ children }) {
  const pathname = usePathname();
  const isPublic = pathname === '/login' || pathname === '/logout';

  return (
    <>
      <NavbarBase />
      {isPublic ? (
        children
      ) : (
        <AuthProvider>
          <NavbarWithAuth />
          {children}
        </AuthProvider>
      )}
    </>
  );
}
