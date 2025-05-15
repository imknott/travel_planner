'use client';

import { useEffect } from 'react';

export default function CarSearchPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//c87.travelpayouts.com/content?trs=416524&shmarker=628500&locale=en&country=13&city=53061&powered_by=true&promo_id=2466';
    script.async = true;
    script.charset = 'utf-8';
    document.getElementById('car-widget-container')?.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen pt-24 px-4 max-w-4xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-4 text-[#007BFF]">Search Rental Cars</h1>
      <p className="text-sm mb-6 text-slate-600 dark:text-slate-300">
        Use the form below to find and book rental cars anywhere in the world.
      </p>
      <div id="car-widget-container" className="w-full min-h-[600px] border rounded bg-white dark:bg-slate-800 shadow-md p-2" />
    </div>
  );
}
