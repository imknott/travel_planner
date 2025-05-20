'use client';

import { AuthProvider } from '@/context/AuthContext';

export default function ClientOnlyLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
