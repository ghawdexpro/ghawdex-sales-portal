import Script from 'next/script';

export default function ZohoSalesIQ() {
  const widgetCode = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_CODE;

  if (!widgetCode) {
    return null;
  }

  return (
    <>
      <Script
        id="zoho-salesiq-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}`
        }}
      />
      <Script
        id="zsiqscript"
        src={`https://salesiq.zohopublic.eu/widget?wc=${widgetCode}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
