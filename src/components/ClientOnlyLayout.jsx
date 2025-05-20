'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/navbar';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
