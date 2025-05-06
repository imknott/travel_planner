'use client';

import { useEffect } from 'react';

export default function Footer() {
     
    return (
        <footer className="text-center text-sm text-gray-500 mt-10 py-4">
        © {new Date().getFullYear()} flighthacked.com · Twitter · GitHub · Support
      </footer>
    );
  }

