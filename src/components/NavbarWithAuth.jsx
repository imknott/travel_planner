'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import Link from 'next/link';

export default function NavbarWithAuth() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) return null;

  return (
    <div className="hidden sm:flex items-center space-x-6">
      {!user ? (
        <Link
          href="/login"
          className="text-sm font-semibold border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition"
        >
          Sign In
        </Link>
      ) : (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {user.displayName || user.email}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border rounded shadow-md text-sm z-50">
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  signOut(getAuth());
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
