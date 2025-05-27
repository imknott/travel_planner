'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavbarBase() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-extrabold leading-none tracking-tight text-[#519d58cc] hover:opacity-90 transition"
        >
          flighthacked
        </Link>
      </div>
    </nav>
  );
}
