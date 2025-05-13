'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { translations } from '@/lib/translations';
import ThemeToggle from '@/components/themeToggle';
import Link from 'next/link';

const supportedLocales = ['en', 'es', 'zh', 'hi', 'ar', 'pt', 'ru', 'ja', 'fr', 'de'];
const defaultLocale = 'en';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Language state synced from URL or localStorage
  const [lang, setLang] = useState(defaultLocale);
  const [menuOpen, setMenuOpen] = useState(false);

  const t = translations[lang] || translations[defaultLocale];

  useEffect(() => {
    const pathLocale = pathname.split('/')[1];
    const isValid = supportedLocales.includes(pathLocale);
    const stored = localStorage.getItem('flighthacked_lang');
    const fallback = stored || defaultLocale;

    const finalLang = isValid ? pathLocale : fallback;
    setLang(finalLang);
  }, [pathname]);

  const handleLangChange = (newLang) => {
    if (newLang === lang) return;

    const segments = pathname.split('/');
    segments[1] = newLang; // Replace locale
    const newPath = segments.join('/');

    localStorage.setItem('flighthacked_lang', newLang);
    setLang(newLang);
    router.push(newPath);
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo Link */}
        <Link href={`/${lang}`} className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          <span className="text-xl font-bold text-[#007BFF]">flighthacked.com</span>
        </Link>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Language Switcher */}
          <select
            className="text-sm px-2 py-1 rounded border bg-white dark:bg-slate-800 dark:text-white text-black"
            value={lang}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="hi">🇮🇳 हिन्दी</option>
            <option value="ar">🇸🇦 العربية</option>
            <option value="pt">🇧🇷 Português</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>

          {/* Mobile Menu Button (optional if you add full menu later) */}
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
