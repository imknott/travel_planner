'use client';

import { useState, useEffect } from 'react';
import { translations } from '@/lib/translations';
import ThemeToggle from '@/components/themeToggle';
import Link from 'next/link';

export default function Navbar() {
  const [lang, setLang] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    const savedLang = localStorage.getItem('flighthacked_lang');
    const browserLang = navigator.language.slice(0, 2);
    const defaultLang = savedLang || (translations[browserLang] ? browserLang : 'en');
    setLang(defaultLang);
  }, []);

  const handleLangChange = (value) => {
    setLang(value);
    localStorage.setItem('flighthacked_lang', value);
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Home Link */}
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold text-[#007BFF]">flighthacked.com</span>
        </Link>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Language Dropdown */}
          <select
            className="text-sm px-2 py-1 rounded border bg-white dark:bg-slate-800 dark:text-white text-black"
            value={lang}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="zh">中文</option>
            <option value="hi">हिन्दी</option>
            <option value="ar">العربية</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="ja">日本語</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>

          {/* Mobile Toggle (if you plan to use it for other links later) */}
          {/* You can remove this too if no other nav items */}
          <button
            className="sm:hidden text-gray-700 dark:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
}
