// components/Navbar.jsx
'use client';

import { useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

export default function Navbar() {
  const [lang, setLang] = useState('en');
  const t = translations[lang] || translations['en'];
  const [menuOpen, setMenuOpen] = useState(false);

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
    <nav className="bg-auto backdrop-blur-md shadow-sm fixed top-0 left-0 w-full z-50">
    <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
      <span className="text-xl font-bold">✈️ flighthacked.com</span>
      <div className="flex items-center space-x-4">
        <select
          className="text-sm px-2 py-1 rounded bg-auto border text-black"
          value={lang}
          onChange={(e) => {
            const selected = e.target.value;
            setLang(selected);
            localStorage.setItem('flighthacked_lang', selected);
          }}
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
        <button
          className="sm:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
        <div className="hidden sm:flex space-x-4">
          <a href="#" className="text-sm hover:text-blue-600">{t.login}</a>
          <a href="#" className="text-sm hover:text-blue-600">{t.signup}</a>
        </div>
      </div>
    </div>
    {menuOpen && (
      <div className="sm:hidden px-4 pb-4">
        <a href="#" className="block py-1 text-sm hover:text-blue-600">{t.login}</a>
        <a href="#" className="block py-1 text-sm hover:text-blue-600">{t.signup}</a>
      </div>
    )}
  </nav>
  );
}
