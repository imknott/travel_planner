'use client';

import { FaInstagram, FaGithub, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  
  return (
    <footer className="text-center text-sm text-gray-500 mt-10 py-4 flex flex-col items-center gap-2">
      <div>
        © {new Date().getFullYear()} flighthacked.com
      </div>
      <div className="flex gap-4 justify-center">
        <a
          href="https://instagram.com/YOUR_HANDLE"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-pink-500"
        >
          <FaInstagram size={18} />
        </a>
        <a
          href="https://github.com/imknott/travel_planner"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-900"
        >
          <FaGithub size={18} />
        </a>
        <a
          href="mailto:support@flighthacked.com"
          className="hover:text-blue-500"
        >
          <FaEnvelope size={18} />
        </a>
      </div>
    </footer>
  );
}

