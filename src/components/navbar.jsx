'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/themeToggle';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* Navigation Links */}
        <div className="hidden sm:flex items-center space-x-6">
          <Link
            href="/"
            className={`text-sm font-medium hover:text-blue-600 transition ${pathname === '/' ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}
          >
            Flights
          </Link>
          <Link
            href="/hotels"
            className={`text-sm font-medium hover:text-blue-600 transition ${pathname.startsWith('/hotels') ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}
          >
            Hotels
          </Link>
          <Link
            href="/cars"
            className={`text-sm font-medium hover:text-blue-600 transition ${pathname.startsWith('/cars') ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}
          >
            Cars
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button (optional) */}
        <button
          className="sm:hidden text-gray-700 dark:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-4 space-y-2">
          <Link href="/" className="block text-sm font-medium text-gray-800 dark:text-white">Flights</Link>
          <Link href="/hotels" className="block text-sm font-medium text-gray-800 dark:text-white">Hotels</Link>
          <Link href="/cars" className="block text-sm font-medium text-gray-800 dark:text-white">Cars</Link>
        </div>
      )}
    </nav>
  );
}
