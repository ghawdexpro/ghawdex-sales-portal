'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Facebook Pixel IDs - DO NOT CHANGE without user permission
const FB_PIXELS = [
  '780274077714265',  // Primary
  '809814008544994',
  '1315803266494960',
  '1965135381010308',
];

export default function FacebookPixel() {
  const pathname = usePathname();

  // Track page views on route change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
  }, [pathname]);

  return (
    <>
      {/* Meta Pixel Code - All 3 pixels */}
      <Script id="facebook-pixel-init" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '780274077714265');
          fbq('init', '809814008544994');
          fbq('init', '1315803266494960');
          fbq('init', '1965135381010308');
          fbq('track', 'PageView');
        `}
      </Script>
      {/* Noscript fallbacks for all pixels */}
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=780274077714265&ev=PageView&noscript=1" alt="" />
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=809814008544994&ev=PageView&noscript=1" alt="" />
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1315803266494960&ev=PageView&noscript=1" alt="" />
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1965135381010308&ev=PageView&noscript=1" alt="" />
      </noscript>
      {/* End Meta Pixel Code */}
    </>
  );
}
