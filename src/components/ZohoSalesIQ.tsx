'use client';

import { useEffect } from 'react';

export default function ZohoSalesIQ() {
  const widgetCode = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_CODE;

  useEffect(() => {
    if (!widgetCode) return;

    // Check if already loaded (prevent duplicates)
    if (document.getElementById('zsiqscript')) return;

    // Step 1: Initialize window.$zoho FIRST
    (window as any).$zoho = (window as any).$zoho || {};
    (window as any).$zoho.salesiq = (window as any).$zoho.salesiq || {
      ready: function() {}
    };

    // Step 2: THEN load the widget script
    const script = document.createElement('script');
    script.id = 'zsiqscript';
    script.src = `https://salesiq.zohopublic.eu/widget?wc=${widgetCode}`;
    script.defer = true;
    document.body.appendChild(script);
  }, [widgetCode]);

  return null;
}
