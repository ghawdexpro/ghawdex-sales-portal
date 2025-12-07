'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function FacebookPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const pixelId2 = process.env.NEXT_PUBLIC_FB_PIXEL_ID_2;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pixelId && !pixelId2) return;

    // Initialize Facebook Pixel(s) using react-facebook-pixel for the primary
    import('react-facebook-pixel')
      .then((module) => module.default)
      .then((ReactPixel) => {
        if (pixelId) {
          ReactPixel.init(pixelId);
          ReactPixel.pageView();
        }
      });
  }, [pixelId, pixelId2]);

  useEffect(() => {
    if ((!pixelId && !pixelId2) || !(window as any).fbq) return;

    // Track page views on route change for both pixels
    (window as any).fbq('track', 'PageView');
  }, [pathname, searchParams, pixelId, pixelId2]);

  // Don't render script if no pixel IDs
  if (!pixelId && !pixelId2) {
    return null;
  }

  // Build init calls for both pixels
  const initCalls = [
    pixelId ? `fbq('init', '${pixelId}');` : '',
    pixelId2 ? `fbq('init', '${pixelId2}');` : '',
  ].filter(Boolean).join('\n            ');

  return (
    <>
      <script
        id="facebook-pixel"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            ${initCalls}
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Noscript fallback for primary pixel */}
      {pixelId && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}
      {/* Noscript fallback for secondary pixel */}
      {pixelId2 && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${pixelId2}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}
    </>
  );
}
