'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WizardProviderV2, useWizardV2 } from '@/components/wizard-v2/WizardContextV2';
import WizardLayoutV2 from '@/components/wizard-v2/WizardLayoutV2';
import Step1Region from '@/components/wizard-v2/steps/Step1Region';
import Step2Calculator from '@/components/wizard-v2/steps/Step2Calculator';
import Step3Safety from '@/components/wizard-v2/steps/Step3Safety';
import Step4Contact from '@/components/wizard-v2/steps/Step4Contact';
import Step5System from '@/components/wizard-v2/steps/Step5System';
import Step6Location from '@/components/wizard-v2/steps/Step6Location';

// Prefill handler for Zoho CRM links
function PrefillHandler() {
  const searchParams = useSearchParams();
  const { dispatch } = useWizardV2();

  useEffect(() => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const zohoId = searchParams.get('zoho_id');

    if (name && email && zohoId) {
      dispatch({
        type: 'SET_PREFILL',
        payload: {
          fullName: decodeURIComponent(name),
          email: decodeURIComponent(email),
          phone: phone ? decodeURIComponent(phone) : '',
          zohoLeadId: zohoId,
        },
      });
    }

    // Location from UTM params
    const campaign = searchParams.get('utm_campaign')?.toLowerCase() || '';
    const content = searchParams.get('utm_content')?.toLowerCase() || '';
    const locationParam = searchParams.get('location')?.toLowerCase() || '';

    if (campaign.includes('gozo') || content.includes('gozo') || locationParam === 'gozo') {
      dispatch({
        type: 'SET_REGION',
        payload: { location: 'gozo', isBatteryOnly: false },
      });
    }
  }, [searchParams, dispatch]);

  return null;
}

// Step router
function WizardSteps() {
  const { state } = useWizardV2();

  switch (state.step) {
    case 1:
      return <Step1Region />;
    case 2:
      return <Step2Calculator />;
    case 3:
      return <Step3Safety />;
    case 4:
      return <Step4Contact />;
    case 5:
      return <Step5System />;
    case 6:
      return <Step6Location />;
    default:
      return <Step1Region />;
  }
}

function WizardV2Content() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  return (
    <WizardProviderV2>
      <PrefillHandler />
      <WizardLayoutV2 onClose={handleClose}>
        <WizardSteps />
      </WizardLayoutV2>
    </WizardProviderV2>
  );
}

export default function WizardV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-amber-400">Loading wizard...</div>
        </div>
      </div>
    }>
      <WizardV2Content />
    </Suspense>
  );
}
