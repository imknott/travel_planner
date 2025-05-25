'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/themeToggle';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold leading-none tracking-tight text-[#007BFF] hover:opacity-90 transition"
        >
          flighthacked
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center space-x-6">
          <Link
            href="/"
            className={`text-sm font-medium hover:text-blue-600 transition ${
              pathname === '/' ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            Flights
          </Link>
          {!loading && (
            user ? (
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
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition"
              >
                Sign In
              </Link>
            )
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden text-gray-700 dark:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-4 space-y-2">
          <Link href="/" className="block text-sm font-medium text-gray-800 dark:text-white">Flights</Link>
          {!loading && (
            user ? (
              <>
                <Link href="/profile" className="block text-sm font-medium text-blue-600">Profile</Link>
                <button
                  onClick={() => signOut(getAuth())}
                  className="block text-sm font-medium text-blue-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="block text-sm font-medium text-blue-600">Sign In</Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
