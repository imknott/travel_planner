'use client';

import { useEffect } from 'react';

export default function GoogleAds() {
  useEffect(() => {
    if (window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {
        console.error('Adsbygoogle error:', e);
      }
    }
  }, []);

  return (
    <div className="mt-8 flex justify-center">
      <ins className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100px' }}
        data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" />
    </div>
  );
}
