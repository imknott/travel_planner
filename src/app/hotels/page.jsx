'use client';

import { useEffect } from 'react';

export default function HotelSearchPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://c121.travelpayouts.com/content?trs=416524&shmarker=628500&lang=www&layout=S10391&powered_by=true&promo_id=4038';
    script.async = true;
    script.charset = 'utf-8';
    document.getElementById('hotel-widget-container')?.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen pt-24 px-4 max-w-4xl mx-auto text-slate-900 dark:text-white transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-4 text-[#007BFF]">Search Hotels</h1>
      <p className="text-sm mb-6 text-slate-600 dark:text-slate-300">
        Easily find and book hotels worldwide using the widget below.
      </p>
      <div id="hotel-widget-container" className="w-full min-h-[600px] border rounded bg-white dark:bg-slate-800 shadow-md p-2" />
    </div>
  );
}
