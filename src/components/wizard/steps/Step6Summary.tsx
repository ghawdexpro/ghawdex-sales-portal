'use client';

import { useWizard } from '../WizardContext';
import { trackWizardComplete, trackQuoteGenerated, trackLeadCreated } from '@/lib/analytics';
import { BATTERY_OPTIONS, GRANT_SCHEME_2025 } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/calculations';
import { getSessionToken } from '@/lib/wizard-session';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

export default function Step6Summary() {
  const { state, dispatch } = useWizard();
  const [showConfetti, setShowConfetti] = useState(true);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const leadCreatedRef = useRef(false);
  const pdfUploadedRef = useRef(false);

  // Generate stable confetti positions (avoid Math.random() in render)
  const confettiPositions = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      left: `${(i * 17 + 5) % 100}%`,  // Deterministic spread based on index
      delay: `${(i * 0.025) % 0.5}s`,
      color: ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899'][i % 4],
    })), []);

  const isBatteryOnly = state.grantType === 'battery_only';

  const battery = state.batterySize
    ? BATTERY_OPTIONS.find(b => b.capacityKwh === state.batterySize)
    : null;

  // Calculate 25-year lifetime earnings (more impactful than CO2)
  const lifetimeEarnings = (state.annualSavings || 0) * 25;

  // Calculate actual grant amount (gross - net) for display
  // This is the ACTUAL grant, not the static grantAmount field on SystemPackage
  const displayGrantAmount = useMemo(() => {
    if (isBatteryOnly) {
      // Battery-only: battery price - total price
      const batteryGrossPrice = battery?.price || 0;
      return Math.max(0, batteryGrossPrice - (state.totalPrice || 0));
    }
    // PV or PV+Battery
    const systemGrossPrice = state.withBattery
      ? (state.selectedSystem?.priceWithBattery || 0)
      : (state.selectedSystem?.priceWithoutGrant || 0);
    const batteryGrossPrice = battery?.price || 0;
    const grossPrice = systemGrossPrice + batteryGrossPrice;
    return Math.max(0, grossPrice - (state.totalPrice || 0));
  }, [isBatteryOnly, battery, state.withBattery, state.selectedSystem, state.totalPrice]);

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Generate quote ref once (stable across re-renders)
  const [quoteRef] = useState(() => `GHX-${Date.now().toString(36).toUpperCase()}`);

  // Upload PDF to storage and update lead
  const uploadProposalPdf = useCallback(async (htmlContent: string) => {
    if (pdfUploadedRef.current || !state.fullName) return null;
    pdfUploadedRef.current = true;
    setPdfUploading(true);

    try {
      // Dynamically import html2pdf.js (client-side only)
      const html2pdf = (await import('html2pdf.js')).default;

      // Create a temporary container for the HTML
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Generate PDF blob
      const pdfBlob = await html2pdf()
        .set({
          margin: 10,
          filename: `proposal_${state.fullName?.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .outputPdf('blob');

      // Clean up
      document.body.removeChild(container);

      // Upload to Supabase storage
      const formData = new FormData();
      formData.append('file', pdfBlob, 'proposal.pdf');
      formData.append('lead_name', state.fullName || 'customer');

      const uploadResponse = await fetch('/api/upload/proposal', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const { url } = await uploadResponse.json();

      // Save URL to context
      dispatch({ type: 'SET_PROPOSAL_URL', payload: { proposalFileUrl: url } });
      setPdfUploaded(true);

      // Update the lead with proposal URL via PATCH
      if (state.zohoLeadId || state.email) {
        await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: state.email,
            proposal_file_url: url,
          }),
        });
      }

      return url;
    } catch (error) {
      console.error('Failed to upload proposal PDF:', error);
      pdfUploadedRef.current = false; // Allow retry
      return null;
    } finally {
      setPdfUploading(false);
    }
  }, [state.fullName, state.zohoLeadId, state.email, dispatch]);

  useEffect(() => {
    // Track quote generation for both solar and battery-only modes
    if (state.totalPrice && (state.selectedSystem || isBatteryOnly)) {
      trackQuoteGenerated(state.totalPrice, state.selectedSystem?.systemSizeKw || 0);
      trackWizardComplete();
    }

    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [state.totalPrice, state.selectedSystem, isBatteryOnly]);

  // Create lead for prefilled users (they skip Step5 which normally creates the lead)
  // Uses the API route to ensure dual-write to Supabase AND Zoho CRM
  useEffect(() => {
    const createLeadForPrefilledUser = async () => {
      if (!state.isPrefilledLead || leadCreatedRef.current) return;
      if (!state.fullName || !state.email) return;

      leadCreatedRef.current = true;

      try {
        // Get session token for linking wizard session to lead
        const sessionToken = getSessionToken();

        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.fullName,
            email: state.email,
            phone: state.phone,
            address: state.address,
            coordinates: state.coordinates,
            google_maps_link: state.googleMapsLink,
            household_size: state.householdSize,
            monthly_bill: state.monthlyBill,
            consumption_kwh: state.consumptionKwh,
            roof_area: state.roofArea,
            selected_system: isBatteryOnly ? 'battery_only' : (state.selectedSystem?.id || null),
            system_size_kw: state.selectedSystem?.systemSizeKw || 0,
            with_battery: state.withBattery || isBatteryOnly,
            battery_size_kwh: battery?.capacityKwh || null,
            grant_path: state.grantPath,
            grant_type: state.grantType, // Include grant type to identify battery-only leads
            grant_amount: displayGrantAmount, // Calculated grant amount
            payment_method: state.paymentMethod,
            loan_term: state.loanTerm,
            total_price: state.totalPrice,
            monthly_payment: state.monthlyPayment,
            annual_savings: state.annualSavings,
            notes: isBatteryOnly ? 'Battery-only installation (no solar)' : null,
            zoho_lead_id: state.zohoLeadId,
            source: 'zoho_crm',
            session_token: sessionToken,
            // Equipment details for Zoho
            panel_brand: isBatteryOnly ? null : 'Huawei',
            panel_model: state.selectedSystem ? `${state.selectedSystem.panelWattage}W Mono PERC` : null,
            panel_count: state.selectedSystem?.panels || null,
            panel_wattage: state.selectedSystem?.panelWattage || null,
            inverter_brand: (state.selectedSystem || isBatteryOnly) ? 'Huawei' : null,
            inverter_model: state.selectedSystem?.inverterModel || (isBatteryOnly ? 'SUN2000 Hybrid' : null),
            battery_brand: battery ? 'Huawei' : null,
            battery_model: battery?.name || null,
          }),
        });

        if (response.ok) {
          trackLeadCreated(state.selectedSystem?.systemSizeKw || 0);
        } else {
          console.error('Failed to create lead:', await response.text());
        }
      } catch (error) {
        console.error('Error creating lead for prefilled user:', error);
      }
    };

    createLeadForPrefilledUser();
  }, [state.isPrefilledLead, state.fullName, state.email, state.phone, state.address, state.coordinates, state.googleMapsLink, state.householdSize, state.monthlyBill, state.consumptionKwh, state.roofArea, state.selectedSystem, state.withBattery, battery, state.grantPath, state.grantType, state.paymentMethod, state.loanTerm, state.totalPrice, state.monthlyPayment, state.annualSavings, state.zohoLeadId, isBatteryOnly]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      isBatteryOnly
        ? `Hi! I just completed my battery storage quote on your portal.\n\n` +
          `Name: ${state.fullName}\n` +
          `Battery: ${battery?.capacityKwh || 0} kWh (${battery?.name})\n` +
          `Location: ${state.location === 'gozo' ? 'Gozo' : 'Malta'}\n` +
          `Total: ${formatCurrency(state.totalPrice || 0)}\n\n` +
          `I'd like to proceed with my battery installation!`
        : `Hi! I just completed my solar quote on your portal.\n\n` +
          `Name: ${state.fullName}\n` +
          `System: ${state.selectedSystem?.name} (${state.selectedSystem?.systemSizeKw} kWp)\n` +
          `Total: ${formatCurrency(state.totalPrice || 0)}\n\n` +
          `I'd like to proceed with my installation!`
    );
    window.open(`https://wa.me/35679055156?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+35679055156';
  };

  const generateProposal = () => {
    // Battery-only has different PDF structure
    if (isBatteryOnly) {
      const grantPercentage = state.location === 'gozo' ? 95 : 80;
      const batteryGrossPrice = battery ? battery.price : 0;
      const grantAmount = batteryGrossPrice - (state.totalPrice || 0);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Battery Storage Proposal - ${state.fullName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a2e; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #f59e0b; }
            .logo span { color: #1a1a2e; }
            .doc-info { text-align: right; font-size: 12px; color: #666; }
            .doc-info strong { display: block; font-size: 14px; color: #1a1a2e; }
            h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a2e; }
            h2 { font-size: 18px; margin: 30px 0 15px; color: #8b5cf6; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            .customer-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .customer-info p { margin: 5px 0; }
            .price-box { background: linear-gradient(135deg, #ede9fe, #ddd6fe); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; }
            .price-box .label { font-size: 14px; color: #6d28d9; margin-bottom: 5px; }
            .price-box .amount { font-size: 42px; font-weight: bold; color: #1a1a2e; }
            .price-box .grant { color: #16a34a; font-size: 14px; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
            th { background: #f8f9fa; font-weight: 600; }
            .highlight { background: #ede9fe; }
            .gozo-badge { display: inline-block; background: #16a34a; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .terms { font-size: 11px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
            .terms h3 { font-size: 12px; color: #1a1a2e; margin-bottom: 10px; }
            .terms ul { padding-left: 20px; }
            .terms li { margin: 5px 0; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            .footer strong { color: #8b5cf6; }
            .savings-box { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .savings-box h4 { color: #16a34a; margin-bottom: 10px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Ghawde<span>X</span></div>
              <div style="font-size: 12px; color: #666;">Engineering Excellence in Energy Storage</div>
            </div>
            <div class="doc-info">
              <strong>CONTRACT PROPOSAL</strong>
              Ref: ${quoteRef}<br>
              Date: ${today}<br>
              Valid for: 30 days
            </div>
          </div>

          <h1>Battery Storage Proposal</h1>
          <p style="color: #666; margin-bottom: 20px;">Thank you for choosing GhawdeX Engineering for your battery storage installation.</p>

          <div class="customer-info">
            <p><strong>Customer:</strong> ${state.fullName}</p>
            <p><strong>Email:</strong> ${state.email}</p>
            <p><strong>Phone:</strong> ${state.phone}</p>
            <p><strong>Installation Address:</strong> ${state.address}</p>
            <p><strong>Location:</strong> ${state.location === 'gozo' ? '<span class="gozo-badge">Gozo - 95% Grant</span>' : 'Malta'}</p>
          </div>

          <div class="price-box">
            <div class="label">Your Investment</div>
            <div class="amount">${formatCurrency(state.totalPrice || 0)}</div>
            <div class="grant">After ${grantPercentage}% government grant (saving ${formatCurrency(grantAmount)})</div>
          </div>

          <h2>Battery System</h2>
          <table>
            <tr class="highlight">
              <td><strong>Battery Model</strong></td>
              <td>${battery?.name || 'Huawei LUNA2000'}</td>
            </tr>
            <tr class="highlight">
              <td><strong>Capacity</strong></td>
              <td>${battery?.capacityKwh || 0} kWh</td>
            </tr>
            <tr>
              <td><strong>Battery Type</strong></td>
              <td>LiFePO4 (Lithium Iron Phosphate)</td>
            </tr>
            <tr>
              <td><strong>Hybrid Inverter</strong></td>
              <td>Included in system</td>
            </tr>
            <tr>
              <td><strong>Cycle Life</strong></td>
              <td>6,000+ cycles</td>
            </tr>
            <tr>
              <td><strong>Warranty</strong></td>
              <td>10 years manufacturer warranty</td>
            </tr>
          </table>

          <h2>Grant Calculation (REWS 2025)</h2>
          <table>
            <tr>
              <td><strong>System Gross Price</strong></td>
              <td>${formatCurrency(batteryGrossPrice)}</td>
            </tr>
            <tr>
              <td><strong>Grant Rate</strong></td>
              <td>${grantPercentage}% (${state.location === 'gozo' ? 'Gozo enhanced rate' : 'Malta standard rate'})</td>
            </tr>
            <tr>
              <td><strong>Grant Cap</strong></td>
              <td>€720/kWh (max ${state.location === 'gozo' ? '€8,550' : '€7,200'})</td>
            </tr>
            <tr class="highlight">
              <td><strong>Grant Amount</strong></td>
              <td style="color: #16a34a; font-weight: bold;">${formatCurrency(grantAmount)}</td>
            </tr>
            <tr class="highlight">
              <td><strong>You Pay</strong></td>
              <td style="font-weight: bold;">${formatCurrency(state.totalPrice || 0)}</td>
            </tr>
          </table>

          <div class="savings-box">
            <h4>How Battery Storage Saves You Money</h4>
            <p style="font-size: 13px; color: #333;">
              Your battery stores energy when rates are low and powers your home during peak hours.
              This tariff arbitrage saves approximately <strong>${formatCurrency(state.annualSavings || 0)}/year</strong>.
            </p>
          </div>

          <h2>Financial Summary</h2>
          <table>
            <tr>
              <td><strong>Estimated Annual Savings</strong></td>
              <td style="color: #16a34a; font-weight: bold;">${formatCurrency(state.annualSavings || 0)}</td>
            </tr>
            <tr>
              <td><strong>Payback Period</strong></td>
              <td>${state.paybackYears} years</td>
            </tr>
            <tr>
              <td><strong>Payment Method</strong></td>
              <td>${state.paymentMethod === 'loan' ? `BOV Financing (${state.loanTerm ? state.loanTerm / 12 : 0} years) - ${formatCurrency(state.monthlyPayment || 0)}/month` : 'Full Payment'}</td>
            </tr>
          </table>

          <div class="terms">
            <h3>Terms & Conditions</h3>
            <ul>
              <li>This proposal is valid for 30 days from the date of issue</li>
              <li>Final price subject to site survey and technical assessment</li>
              <li>Government grant subject to REWS approval and availability</li>
              <li>Battery-only grant requires no previous battery grant in last 6 years</li>
              <li>Installation timeline: 7-14 days from contract signing</li>
              <li>All equipment comes with manufacturer warranty</li>
              <li>Price includes installation, commissioning, and grid connection</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>GhawdeX Engineering</strong></p>
            <p>Phone: +356 7905 5156 | Email: info@ghawdex.pro</p>
            <p>www.ghawdex.pro</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }

      // Upload PDF to storage (non-blocking)
      uploadProposalPdf(html);
      return;
    }

    // Standard solar system proposal
    const fitRate = state.grantType === 'none'
      ? GRANT_SCHEME_2025.FIT_WITHOUT_GRANT
      : GRANT_SCHEME_2025.FIT_WITH_GRANT;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solar System Proposal - ${state.fullName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a2e; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #f59e0b; }
          .logo span { color: #1a1a2e; }
          .doc-info { text-align: right; font-size: 12px; color: #666; }
          .doc-info strong { display: block; font-size: 14px; color: #1a1a2e; }
          h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a2e; }
          h2 { font-size: 18px; margin: 30px 0 15px; color: #f59e0b; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          .customer-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .customer-info p { margin: 5px 0; }
          .price-box { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; }
          .price-box .label { font-size: 14px; color: #92400e; margin-bottom: 5px; }
          .price-box .amount { font-size: 42px; font-weight: bold; color: #1a1a2e; }
          .price-box .grant { color: #16a34a; font-size: 14px; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f8f9fa; font-weight: 600; }
          .highlight { background: #fef3c7; }
          .terms { font-size: 11px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          .terms h3 { font-size: 12px; color: #1a1a2e; margin-bottom: 10px; }
          .terms ul { padding-left: 20px; }
          .terms li { margin: 5px 0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          .footer strong { color: #f59e0b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Ghawde<span>X</span></div>
            <div style="font-size: 12px; color: #666;">Engineering Excellence in Solar</div>
          </div>
          <div class="doc-info">
            <strong>CONTRACT PROPOSAL</strong>
            Ref: ${quoteRef}<br>
            Date: ${today}<br>
            Valid for: 30 days
          </div>
        </div>

        <h1>Solar System Proposal</h1>
        <p style="color: #666; margin-bottom: 20px;">Thank you for choosing GhawdeX Engineering for your solar installation.</p>

        <div class="customer-info">
          <p><strong>Customer:</strong> ${state.fullName}</p>
          <p><strong>Email:</strong> ${state.email}</p>
          <p><strong>Phone:</strong> ${state.phone}</p>
          <p><strong>Installation Address:</strong> ${state.address}</p>
          <p><strong>Location:</strong> ${state.location === 'gozo' ? 'Gozo' : 'Malta'}</p>
        </div>

        <div class="price-box">
          <div class="label">Total Investment</div>
          <div class="amount">${formatCurrency(state.totalPrice || 0)}</div>
          ${state.grantType !== 'none' ? `<div class="grant">After government grant applied</div>` : ''}
        </div>

        <h2>System Configuration</h2>
        <table>
          <tr>
            <td><strong>Package</strong></td>
            <td>${state.selectedSystem?.name} Package</td>
          </tr>
          <tr>
            <td><strong>System Size</strong></td>
            <td>${state.selectedSystem?.systemSizeKw} kWp</td>
          </tr>
          <tr>
            <td><strong>Solar Panels</strong></td>
            <td>${state.selectedSystem?.panels} × ${state.selectedSystem?.panelWattage}W panels</td>
          </tr>
          <tr>
            <td><strong>Inverter</strong></td>
            <td>${state.selectedSystem?.inverterModel}</td>
          </tr>
          ${battery ? `
          <tr class="highlight">
            <td><strong>Battery Storage</strong></td>
            <td>${battery.name} (${battery.capacityKwh} kWh)</td>
          </tr>
          ` : ''}
        </table>

        <h2>Financial Summary</h2>
        <table>
          <tr>
            <td><strong>Annual Production</strong></td>
            <td>${formatNumber(state.selectedSystem?.annualProductionKwh || 0)} kWh</td>
          </tr>
          <tr>
            <td><strong>Feed-in Tariff Rate</strong></td>
            <td>€${fitRate}/kWh (guaranteed 20 years)</td>
          </tr>
          <tr>
            <td><strong>Estimated Annual Income</strong></td>
            <td style="color: #16a34a; font-weight: bold;">${formatCurrency(state.annualSavings || 0)}</td>
          </tr>
          <tr>
            <td><strong>Payback Period</strong></td>
            <td>${state.paybackYears} years</td>
          </tr>
          <tr>
            <td><strong>Payment Method</strong></td>
            <td>${state.paymentMethod === 'loan' ? `BOV Financing (${state.loanTerm ? state.loanTerm / 12 : 0} years) - ${formatCurrency(state.monthlyPayment || 0)}/month` : 'Full Payment'}</td>
          </tr>
        </table>

        ${state.grantType !== 'none' ? `
        <h2>Government Grant (REWS 2025)</h2>
        <table>
          <tr>
            <td><strong>Grant Scheme</strong></td>
            <td>${state.grantType === 'pv_battery' ? 'PV + Battery Storage' : 'PV System Only'}</td>
          </tr>
          <tr>
            <td><strong>Grant Amount</strong></td>
            <td style="color: #16a34a; font-weight: bold;">${formatCurrency(displayGrantAmount)}</td>
          </tr>
          <tr>
            <td><strong>Grant Status</strong></td>
            <td>Subject to REWS approval</td>
          </tr>
        </table>
        ` : ''}

        <div class="terms">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>This proposal is valid for 30 days from the date of issue</li>
            <li>Final price subject to site survey and technical assessment</li>
            <li>Government grant subject to REWS approval and availability</li>
            <li>Installation timeline: 14 days from contract signing (subject to permit approval)</li>
            <li>All equipment comes with manufacturer warranty</li>
            <li>Price includes installation, commissioning, and grid connection</li>
          </ul>
        </div>

        <div class="footer">
          <p><strong>GhawdeX Engineering</strong></p>
          <p>Phone: +356 7905 5156 | Email: info@ghawdex.pro</p>
          <p>www.ghawdex.pro</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }

    // Upload PDF to storage (non-blocking)
    uploadProposalPdf(html);
  };

  const generateTechSpec = () => {
    // Battery-only has different tech spec structure
    if (isBatteryOnly) {
      // Huawei battery specifications for battery-only
      const batterySpecs: Record<string, { usableCapacity: string; voltage: string; maxCharge: string; maxDischarge: string; weight: string; dimensions: string; datasheet: string }> = {
        'Huawei LUNA2000-5-S0': {
          usableCapacity: '5 kWh',
          voltage: '40-60 V',
          maxCharge: '2.5 kW',
          maxDischarge: '2.5 kW',
          weight: '63.8 kg',
          dimensions: '670 × 150 × 600 mm',
          datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/LUNA2000-5-15-S0.pdf',
        },
        'Huawei LUNA2000-10-S0': {
          usableCapacity: '10 kWh',
          voltage: '80-120 V',
          maxCharge: '5 kW',
          maxDischarge: '5 kW',
          weight: '114 kg',
          dimensions: '670 × 150 × 960 mm',
          datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/LUNA2000-5-15-S0.pdf',
        },
        'Huawei LUNA2000-15-S0': {
          usableCapacity: '15 kWh',
          voltage: '120-180 V',
          maxCharge: '5 kW',
          maxDischarge: '5 kW',
          weight: '164 kg',
          dimensions: '670 × 150 × 1320 mm',
          datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/LUNA2000-5-15-S0.pdf',
        },
      };

      const batterySpec = battery ? batterySpecs[battery.name] || batterySpecs['Huawei LUNA2000-10-S0'] : batterySpecs['Huawei LUNA2000-10-S0'];

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Battery Technical Specification - ${state.fullName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a2e; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #f59e0b; }
            .logo span { color: #1a1a2e; }
            .huawei-badge { display: inline-flex; align-items: center; gap: 8px; background: #c7000b; color: white; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-top: 8px; }
            .doc-info { text-align: right; font-size: 12px; color: #666; }
            .doc-info strong { display: block; font-size: 14px; color: #1a1a2e; }
            h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a2e; }
            h2 { font-size: 16px; margin: 25px 0 12px; color: #8b5cf6; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            .site-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #8b5cf6; }
            .site-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px 12px; text-align: left; border: 1px solid #e5e7eb; }
            th { background: #f8f9fa; font-weight: 600; width: 40%; }
            .spec-value { font-weight: 500; }
            .highlight { background: #ede9fe; }
            .performance-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .perf-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
            .perf-item .value { font-size: 24px; font-weight: bold; color: #1a1a2e; }
            .perf-item .label { font-size: 12px; color: #666; margin-top: 5px; }
            .datasheet-link { display: inline-flex; align-items: center; gap: 6px; background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500; margin-top: 10px; }
            .datasheet-link:hover { background: #7c3aed; }
            .ecosystem-box { background: linear-gradient(135deg, #f5f3ff, #fff); border: 1px solid #8b5cf6; border-radius: 12px; padding: 20px; margin: 25px 0; }
            .ecosystem-box h3 { color: #8b5cf6; font-size: 14px; margin-bottom: 15px; }
            .ecosystem-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .ecosystem-item { text-align: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #eee; }
            .ecosystem-item .icon { font-size: 24px; margin-bottom: 5px; }
            .ecosystem-item .name { font-size: 11px; color: #666; }
            .notes { background: #ede9fe; padding: 15px; border-radius: 8px; margin-top: 25px; font-size: 12px; }
            .notes h3 { font-size: 13px; margin-bottom: 10px; color: #6d28d9; }
            .notes ul { padding-left: 20px; }
            .notes li { margin: 5px 0; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { padding: 20px; } .datasheet-link { background: #666; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Ghawde<span>X</span></div>
              <div style="font-size: 12px; color: #666;">Engineering Excellence in Energy Storage</div>
              <div class="huawei-badge">
                <span>HUAWEI</span> Certified Partner
              </div>
            </div>
            <div class="doc-info">
              <strong>TECHNICAL SPECIFICATION</strong>
              Ref: ${quoteRef}<br>
              Date: ${today}
            </div>
          </div>

          <h1>Huawei LUNA2000 Battery System Specification</h1>
          <p style="color: #666; margin-bottom: 20px;">Premium LiFePO4 battery storage with industry-leading safety and performance.</p>

          <div class="site-info">
            <p><strong>Customer:</strong> ${state.fullName}</p>
            <p><strong>Installation Site:</strong> ${state.address}</p>
            <p><strong>Location:</strong> ${state.location === 'gozo' ? 'Gozo (95% Grant Eligible)' : 'Malta'}</p>
          </div>

          <div class="performance-box">
            <div class="perf-item">
              <div class="value">${battery?.capacityKwh || 10} kWh</div>
              <div class="label">Storage Capacity</div>
            </div>
            <div class="perf-item">
              <div class="value">${batterySpec.maxDischarge}</div>
              <div class="label">Max Power Output</div>
            </div>
            <div class="perf-item">
              <div class="value">6,000+</div>
              <div class="label">Cycle Life</div>
            </div>
            <div class="perf-item">
              <div class="value">10</div>
              <div class="label">Warranty (years)</div>
            </div>
          </div>

          <div class="ecosystem-box">
            <h3>Huawei Energy Storage System</h3>
            <div class="ecosystem-grid">
              <div class="ecosystem-item">
                <div class="icon">🔋</div>
                <div class="name">LUNA2000 Battery</div>
              </div>
              <div class="ecosystem-item">
                <div class="icon">⚡</div>
                <div class="name">Hybrid Inverter</div>
              </div>
              <div class="ecosystem-item">
                <div class="icon">📱</div>
                <div class="name">FusionSolar App</div>
              </div>
            </div>
          </div>

          <h2>Huawei LUNA2000 Smart Battery</h2>
          <table>
            <tr class="highlight">
              <th>Model</th>
              <td class="spec-value">${battery?.name || 'Huawei LUNA2000-10-S0'}</td>
            </tr>
            <tr class="highlight">
              <th>Usable Capacity</th>
              <td class="spec-value">${batterySpec.usableCapacity}</td>
            </tr>
            <tr>
              <th>Battery Chemistry</th>
              <td class="spec-value">Lithium Iron Phosphate (LiFePO4)</td>
            </tr>
            <tr>
              <th>Operating Voltage</th>
              <td class="spec-value">${batterySpec.voltage}</td>
            </tr>
            <tr>
              <th>Max Charge Power</th>
              <td class="spec-value">${batterySpec.maxCharge}</td>
            </tr>
            <tr>
              <th>Max Discharge Power</th>
              <td class="spec-value">${batterySpec.maxDischarge}</td>
            </tr>
            <tr>
              <th>Cycle Life</th>
              <td class="spec-value">>6,000 cycles @ 90% DoD</td>
            </tr>
            <tr>
              <th>Depth of Discharge</th>
              <td class="spec-value">100%</td>
            </tr>
            <tr>
              <th>Round-Trip Efficiency</th>
              <td class="spec-value">>95%</td>
            </tr>
            <tr>
              <th>Dimensions</th>
              <td class="spec-value">${batterySpec.dimensions}</td>
            </tr>
            <tr>
              <th>Weight</th>
              <td class="spec-value">${batterySpec.weight}</td>
            </tr>
            <tr>
              <th>IP Rating</th>
              <td class="spec-value">IP66 (outdoor installation)</td>
            </tr>
            <tr>
              <th>Operating Temperature</th>
              <td class="spec-value">-10°C to +55°C</td>
            </tr>
            <tr>
              <th>Warranty</th>
              <td class="spec-value">10 years manufacturer warranty</td>
            </tr>
          </table>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;">
            <a href="${batterySpec.datasheet}" target="_blank" class="datasheet-link">
              📄 Download Battery Datasheet (PDF)
            </a>
          </div>

          <h2>Hybrid Inverter (Included)</h2>
          <table>
            <tr>
              <th>Type</th>
              <td class="spec-value">Huawei SUN2000 Hybrid</td>
            </tr>
            <tr>
              <th>Function</th>
              <td class="spec-value">Battery Management + Grid Connection</td>
            </tr>
            <tr>
              <th>Solar Ready</th>
              <td class="spec-value">Yes - Add PV panels anytime</td>
            </tr>
            <tr>
              <th>Monitoring</th>
              <td class="spec-value">Huawei FusionSolar App (iOS/Android)</td>
            </tr>
          </table>

          <h2>Safety Features</h2>
          <table>
            <tr>
              <th>Battery Chemistry</th>
              <td class="spec-value">LiFePO4 - Non-flammable, most stable lithium type</td>
            </tr>
            <tr>
              <th>Thermal Runaway</th>
              <td class="spec-value">Not possible with LiFePO4 chemistry</td>
            </tr>
            <tr>
              <th>Fire Safety</th>
              <td class="spec-value">Cannot catch fire under any conditions</td>
            </tr>
            <tr>
              <th>Certifications</th>
              <td class="spec-value">TÜV, CE, IEC 62619, UN38.3</td>
            </tr>
          </table>

          <div class="notes">
            <h3>Important Notes</h3>
            <ul>
              <li>Battery can be expanded with additional modules in the future</li>
              <li>Solar panels can be added later using the same hybrid inverter</li>
              <li>Final installation location subject to site survey</li>
              <li>All equipment specifications subject to availability</li>
              <li>Installation includes all mounting, cabling, and protection devices</li>
              <li>Grid connection coordination with Enemalta included</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>GhawdeX Engineering</strong> - Huawei Certified Partner</p>
            <p>Phone: +356 7905 5156 | Email: info@ghawdex.pro</p>
            <p>www.ghawdex.pro</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
      return;
    }

    // Standard solar system tech spec
    // Huawei inverter specifications
    const inverterSpecs: Record<string, { maxDcPower: string; mpptVoltage: string; maxEfficiency: string; weight: string; dimensions: string; datasheet: string }> = {
      'Huawei SUN2000-3KTL-L1': {
        maxDcPower: '4.5 kW',
        mpptVoltage: '140-980 V',
        maxEfficiency: '98.4%',
        weight: '10.5 kg',
        dimensions: '365 × 365 × 156 mm',
        datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/SUN2000-3-10KTL-M1.pdf',
      },
      'Huawei SUN2000-5KTL-L1': {
        maxDcPower: '7.5 kW',
        mpptVoltage: '140-980 V',
        maxEfficiency: '98.6%',
        weight: '10.5 kg',
        dimensions: '365 × 365 × 156 mm',
        datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/SUN2000-3-10KTL-M1.pdf',
      },
      'Huawei SUN2000-10KTL-M1': {
        maxDcPower: '15 kW',
        mpptVoltage: '200-1000 V',
        maxEfficiency: '98.6%',
        weight: '23.5 kg',
        dimensions: '525 × 470 × 262 mm',
        datasheet: 'https://solar.huawei.com/-/media/Solar/attachment/pdf/apac/datasheet/SUN2000-12-20KTL-M0.pdf',
      },
      'Huawei SUN2000-15KTL-M5': {
        maxDcPower: '22.5 kW',
        mpptVoltage: '200-1080 V',
        maxEfficiency: '98.7%',
        weight: '27 kg',
        dimensions: '550 × 470 × 280 mm',
        datasheet: 'https://solar.huawei.com/-/media/Solar/attachment/pdf/apac/datasheet/SUN2000-12-20KTL-M0.pdf',
      },
    };

    // Huawei battery specifications
    const batterySpecs: Record<string, { usableCapacity: string; voltage: string; maxCharge: string; maxDischarge: string; weight: string; dimensions: string; datasheet: string }> = {
      'Huawei LUNA2000-5-S0': {
        usableCapacity: '5 kWh',
        voltage: '40-60 V',
        maxCharge: '2.5 kW',
        maxDischarge: '2.5 kW',
        weight: '63.8 kg',
        dimensions: '670 × 150 × 600 mm',
        datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/LUNA2000-5-15-S0.pdf',
      },
      'Huawei LUNA2000-10-S0': {
        usableCapacity: '10 kWh',
        voltage: '80-120 V',
        maxCharge: '5 kW',
        maxDischarge: '5 kW',
        weight: '114 kg',
        dimensions: '670 × 150 × 960 mm',
        datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/LUNA2000-5-15-S0.pdf',
      },
      'Huawei LUNA2000-15-S0': {
        usableCapacity: '15 kWh',
        voltage: '120-180 V',
        maxCharge: '5 kW',
        maxDischarge: '5 kW',
        weight: '164 kg',
        dimensions: '670 × 150 × 1320 mm',
        datasheet: 'https://solar.huawei.com/en-GB/download?p=/-/media/Solar/attachment/pdf/eu/datasheet/LUNA2000-5-15-S0.pdf',
      },
    };

    const inverter = inverterSpecs[state.selectedSystem?.inverterModel || ''] || inverterSpecs['Huawei SUN2000-5KTL-L1'];
    const batterySpec = battery ? batterySpecs[battery.name] || batterySpecs['Huawei LUNA2000-10-S0'] : null;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Technical Specification - ${state.fullName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a2e; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #c7000b; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #f59e0b; }
          .logo span { color: #1a1a2e; }
          .huawei-badge { display: inline-flex; align-items: center; gap: 8px; background: #c7000b; color: white; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-top: 8px; }
          .doc-info { text-align: right; font-size: 12px; color: #666; }
          .doc-info strong { display: block; font-size: 14px; color: #1a1a2e; }
          h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a2e; }
          h2 { font-size: 16px; margin: 25px 0 12px; color: #c7000b; border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center; gap: 10px; }
          h2 img { height: 20px; }
          .site-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #c7000b; }
          .site-info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px 12px; text-align: left; border: 1px solid #e5e7eb; }
          th { background: #f8f9fa; font-weight: 600; width: 40%; }
          .spec-value { font-weight: 500; }
          .highlight { background: #fef3c7; }
          .performance-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .perf-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .perf-item .value { font-size: 24px; font-weight: bold; color: #1a1a2e; }
          .perf-item .label { font-size: 12px; color: #666; margin-top: 5px; }
          .datasheet-link { display: inline-flex; align-items: center; gap: 6px; background: #c7000b; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500; margin-top: 10px; }
          .datasheet-link:hover { background: #a5000a; }
          .datasheet-section { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd; }
          .ecosystem-box { background: linear-gradient(135deg, #fff5f5, #fff); border: 1px solid #c7000b; border-radius: 12px; padding: 20px; margin: 25px 0; }
          .ecosystem-box h3 { color: #c7000b; font-size: 14px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
          .ecosystem-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .ecosystem-item { text-align: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #eee; }
          .ecosystem-item .icon { font-size: 24px; margin-bottom: 5px; }
          .ecosystem-item .name { font-size: 11px; color: #666; }
          .notes { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 25px; font-size: 12px; }
          .notes h3 { font-size: 13px; margin-bottom: 10px; }
          .notes ul { padding-left: 20px; }
          .notes li { margin: 5px 0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { padding: 20px; }
            .datasheet-link { background: #666; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Ghawde<span>X</span></div>
            <div style="font-size: 12px; color: #666;">Engineering Excellence in Solar</div>
            <div class="huawei-badge">
              <span>HUAWEI</span> Certified Partner
            </div>
          </div>
          <div class="doc-info">
            <strong>TECHNICAL SPECIFICATION</strong>
            Ref: ${quoteRef}<br>
            Date: ${today}
          </div>
        </div>

        <h1>Huawei FusionSolar System Specification</h1>
        <p style="color: #666; margin-bottom: 20px;">Complete Huawei ecosystem for maximum efficiency and reliability.</p>

        <div class="site-info">
          <p><strong>Customer:</strong> ${state.fullName}</p>
          <p><strong>Installation Site:</strong> ${state.address}</p>
          <p><strong>Location:</strong> ${state.location === 'gozo' ? 'Gozo' : 'Malta'}</p>
          ${state.roofArea && !state.solarDataIsFallback ? `<p><strong>Estimated Roof Area:</strong> ${state.roofArea}m² (to be confirmed on site visit)</p>` : ''}
        </div>

        <div class="performance-box">
          <div class="perf-item">
            <div class="value">${state.selectedSystem?.systemSizeKw} kWp</div>
            <div class="label">System Capacity</div>
          </div>
          <div class="perf-item">
            <div class="value">${formatNumber(state.selectedSystem?.annualProductionKwh || 0)}</div>
            <div class="label">Annual Production (kWh)</div>
          </div>
          <div class="perf-item">
            <div class="value" style="color: #22c55e;">${formatCurrency(lifetimeEarnings)}</div>
            <div class="label">25-Year Earnings</div>
          </div>
          <div class="perf-item">
            <div class="value">25+</div>
            <div class="label">System Lifespan (years)</div>
          </div>
        </div>

        <div class="ecosystem-box">
          <h3>
            <span style="color: #c7000b; font-weight: bold;">HUAWEI</span> FusionSolar Ecosystem
          </h3>
          <div class="ecosystem-grid">
            <div class="ecosystem-item">
              <div class="icon">☀️</div>
              <div class="name">Solar Panels</div>
            </div>
            <div class="ecosystem-item">
              <div class="icon">⚡</div>
              <div class="name">SUN2000 Inverter</div>
            </div>
            ${battery ? `
            <div class="ecosystem-item">
              <div class="icon">🔋</div>
              <div class="name">LUNA2000 Battery</div>
            </div>
            ` : `
            <div class="ecosystem-item">
              <div class="icon">📱</div>
              <div class="name">FusionSolar App</div>
            </div>
            `}
          </div>
        </div>

        <h2>Solar Panels</h2>
        <table>
          <tr>
            <th>Quantity</th>
            <td class="spec-value">${state.selectedSystem?.panels} panels</td>
          </tr>
          <tr>
            <th>Panel Wattage</th>
            <td class="spec-value">${state.selectedSystem?.panelWattage}W per panel</td>
          </tr>
          <tr>
            <th>Total Capacity</th>
            <td class="spec-value">${state.selectedSystem?.systemSizeKw} kWp (${(state.selectedSystem?.panels || 0) * (state.selectedSystem?.panelWattage || 0)}W)</td>
          </tr>
          <tr>
            <th>Cell Type</th>
            <td class="spec-value">Monocrystalline PERC Half-Cut</td>
          </tr>
          <tr>
            <th>Module Efficiency</th>
            <td class="spec-value">>21.5%</td>
          </tr>
          <tr>
            <th>Temperature Coefficient</th>
            <td class="spec-value">-0.34%/°C</td>
          </tr>
          <tr>
            <th>Warranty</th>
            <td class="spec-value">12 years product / 25 years performance</td>
          </tr>
        </table>
        <div class="datasheet-section">
          <a href="https://www.jasolar.com/uploadfile/2021/0706/20210706053524693.pdf" target="_blank" class="datasheet-link">
            📄 Download Panel Datasheet (PDF)
          </a>
        </div>

        <h2>Huawei SUN2000 Hybrid Inverter</h2>
        <table>
          <tr class="highlight">
            <th>Model</th>
            <td class="spec-value">${state.selectedSystem?.inverterModel}</td>
          </tr>
          <tr>
            <th>Type</th>
            <td class="spec-value">Hybrid (Grid-tied + Battery Ready)</td>
          </tr>
          <tr>
            <th>Rated AC Power</th>
            <td class="spec-value">${state.selectedSystem?.systemSizeKw} kW</td>
          </tr>
          <tr>
            <th>Max DC Input Power</th>
            <td class="spec-value">${inverter.maxDcPower}</td>
          </tr>
          <tr>
            <th>MPPT Voltage Range</th>
            <td class="spec-value">${inverter.mpptVoltage}</td>
          </tr>
          <tr>
            <th>Max Efficiency</th>
            <td class="spec-value">${inverter.maxEfficiency}</td>
          </tr>
          <tr>
            <th>MPPT Trackers</th>
            <td class="spec-value">2 (optimized shade management)</td>
          </tr>
          <tr>
            <th>Dimensions</th>
            <td class="spec-value">${inverter.dimensions}</td>
          </tr>
          <tr>
            <th>Weight</th>
            <td class="spec-value">${inverter.weight}</td>
          </tr>
          <tr>
            <th>IP Rating</th>
            <td class="spec-value">IP65 (outdoor installation)</td>
          </tr>
          <tr>
            <th>Monitoring</th>
            <td class="spec-value">Huawei FusionSolar App (iOS/Android)</td>
          </tr>
          <tr>
            <th>Warranty</th>
            <td class="spec-value">10 years manufacturer warranty</td>
          </tr>
        </table>
        <div class="datasheet-section">
          <a href="${inverter.datasheet}" target="_blank" class="datasheet-link">
            📄 Download Inverter Datasheet (PDF)
          </a>
        </div>

        ${battery && batterySpec ? `
        <h2>Huawei LUNA2000 Smart Battery</h2>
        <table>
          <tr class="highlight">
            <th>Model</th>
            <td class="spec-value">${battery.name}</td>
          </tr>
          <tr class="highlight">
            <th>Usable Capacity</th>
            <td class="spec-value">${batterySpec.usableCapacity}</td>
          </tr>
          <tr>
            <th>Battery Type</th>
            <td class="spec-value">Lithium Iron Phosphate (LiFePO4)</td>
          </tr>
          <tr>
            <th>Operating Voltage</th>
            <td class="spec-value">${batterySpec.voltage}</td>
          </tr>
          <tr>
            <th>Max Charge Power</th>
            <td class="spec-value">${batterySpec.maxCharge}</td>
          </tr>
          <tr>
            <th>Max Discharge Power</th>
            <td class="spec-value">${batterySpec.maxDischarge}</td>
          </tr>
          <tr>
            <th>Cycle Life</th>
            <td class="spec-value">>6,000 cycles @ 90% DoD</td>
          </tr>
          <tr>
            <th>Depth of Discharge</th>
            <td class="spec-value">100%</td>
          </tr>
          <tr>
            <th>Round-Trip Efficiency</th>
            <td class="spec-value">>95%</td>
          </tr>
          <tr>
            <th>Dimensions</th>
            <td class="spec-value">${batterySpec.dimensions}</td>
          </tr>
          <tr>
            <th>Weight</th>
            <td class="spec-value">${batterySpec.weight}</td>
          </tr>
          <tr>
            <th>IP Rating</th>
            <td class="spec-value">IP66 (outdoor installation)</td>
          </tr>
          <tr>
            <th>Warranty</th>
            <td class="spec-value">10 years manufacturer warranty</td>
          </tr>
        </table>
        <div class="datasheet-section">
          <a href="${batterySpec.datasheet}" target="_blank" class="datasheet-link">
            📄 Download Battery Datasheet (PDF)
          </a>
        </div>
        ` : ''}

        <h2>Estimated Performance</h2>
        <table>
          <tr>
            <th>Annual Energy Production</th>
            <td class="spec-value">${formatNumber(state.selectedSystem?.annualProductionKwh || 0)} kWh</td>
          </tr>
          <tr>
            <th>Daily Average Production</th>
            <td class="spec-value">${formatNumber(Math.round((state.selectedSystem?.annualProductionKwh || 0) / 365))} kWh</td>
          </tr>
          <tr>
            <th>Specific Yield</th>
            <td class="spec-value">${formatNumber(Math.round((state.selectedSystem?.annualProductionKwh || 0) / (state.selectedSystem?.systemSizeKw || 1)))} kWh/kWp/year</td>
          </tr>
          <tr>
            <th>Peak Sun Hours (Malta avg)</th>
            <td class="spec-value">5.5 hours/day</td>
          </tr>
          <tr>
            <th>System Degradation</th>
            <td class="spec-value">0.5% per year (linear)</td>
          </tr>
          <tr>
            <th>25-Year Production Estimate</th>
            <td class="spec-value">${formatNumber(Math.round((state.selectedSystem?.annualProductionKwh || 0) * 23.5))} kWh total</td>
          </tr>
        </table>

        <div class="notes">
          <h3>Important Notes</h3>
          <ul>
            <li>Actual production may vary based on weather, shading, and roof orientation</li>
            <li>Final system design subject to site survey and technical assessment</li>
            <li>All equipment specifications subject to availability</li>
            <li>Installation includes mounting system, DC/AC cabling, and protection devices</li>
            <li>Grid connection and metering by Enemalta (separate application required)</li>
            <li>All Huawei equipment is TÜV certified and complies with EU standards</li>
          </ul>
        </div>

        <div class="footer">
          <p><strong>GhawdeX Engineering</strong> - Huawei Certified Partner</p>
          <p>Phone: +356 7905 5156 | Email: info@ghawdex.pro</p>
          <p>www.ghawdex.pro</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8 relative">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPositions.map((pos, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 animate-confetti"
                style={{
                  left: pos.left,
                  backgroundColor: pos.color,
                  animationDelay: pos.delay,
                }}
              />
            ))}
          </div>
        )}

        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          Your Quote is Ready, {state.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-400">
          {isBatteryOnly
            ? 'Here\'s your personalized battery storage recommendation'
            : 'Here\'s your personalized solar system recommendation'
          }
        </p>
      </div>

      {/* Quote Card */}
      <div className={`bg-gradient-to-br ${isBatteryOnly ? 'from-purple-500/20 to-blue-500/20 border-purple-500/30' : 'from-amber-500/20 to-orange-500/20 border-amber-500/30'} border rounded-2xl p-6 mb-6`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className={`${isBatteryOnly ? 'text-purple-400' : 'text-amber-400'} text-sm font-medium mb-1`}>
              {isBatteryOnly ? 'Battery Storage' : 'Selected System'}
            </div>
            <div className="text-white text-2xl font-bold">
              {isBatteryOnly ? `${battery?.capacityKwh || 0} kWh Battery` : `${state.selectedSystem?.name} Package`}
            </div>
            <div className="text-gray-400">
              {isBatteryOnly
                ? `${battery?.name || 'Huawei LUNA2000'} + Hybrid Inverter`
                : `${state.selectedSystem?.systemSizeKw} kWp • ${state.selectedSystem?.panels} panels`
              }
            </div>
          </div>
          <div className="text-right">
            <div className={`${isBatteryOnly ? 'text-purple-400' : 'text-amber-400'} text-sm font-medium mb-1`}>Total Price</div>
            <div className="text-white text-3xl font-bold">
              {formatCurrency(state.totalPrice || 0)}
            </div>
            {(state.grantPath || isBatteryOnly) && displayGrantAmount > 0 && (
              <div className="text-green-400 text-sm">
                {isBatteryOnly
                  ? `After ${state.location === 'gozo' ? '95%' : '80%'}+ grant`
                  : `Includes ${formatCurrency(displayGrantAmount)} grant`
                }
              </div>
            )}
          </div>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {isBatteryOnly ? (
            <>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Battery Capacity</div>
                <div className="text-purple-400 font-semibold text-xl">
                  {battery?.capacityKwh || 0} kWh
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Est. Annual Savings</div>
                <div className="text-green-400 font-semibold text-xl">
                  {formatCurrency(state.annualSavings || 0)}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Payback Period</div>
                <div className="text-white font-semibold text-xl">
                  {state.paybackYears} years
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Location Bonus</div>
                <div className="text-white font-semibold text-xl">
                  {state.location === 'gozo' ? 'Gozo 95%' : 'Malta 80%'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Annual Production</div>
                <div className="text-white font-semibold text-xl">
                  {formatNumber(state.selectedSystem?.annualProductionKwh || 0)} kWh
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Annual Savings</div>
                <div className="text-green-400 font-semibold text-xl">
                  {formatCurrency(state.annualSavings || 0)}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Payback Period</div>
                <div className="text-white font-semibold text-xl">
                  {state.paybackYears} years
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-gray-400 text-sm">25-Year Earnings</div>
                <div className="text-green-400 font-semibold text-xl">
                  {formatCurrency(lifetimeEarnings)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Payment Method</div>
              <div className="text-white font-semibold">
                {state.paymentMethod === 'loan'
                  ? `BOV Financing (${state.loanTerm ? state.loanTerm / 12 : 0} years)`
                  : 'Pay in Full'
                }
              </div>
            </div>
            {state.paymentMethod === 'loan' && state.monthlyPayment && (
              <div className="text-right">
                <div className="text-amber-400 font-bold text-xl">
                  {formatCurrency(state.monthlyPayment)}/mo
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Battery if selected (only show for solar+battery, not battery-only since it's in main card) */}
        {battery && !isBatteryOnly && (
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">Battery Storage</div>
                  <div className="text-gray-400 text-sm">{battery.name}</div>
                </div>
              </div>
              <div className="text-white font-semibold">{battery.capacityKwh} kWh</div>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="text-gray-400 text-sm mb-2">Installation Address</div>
        <div className="text-white">{state.address}</div>
      </div>

      {/* Download Documents */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold text-lg mb-4">Your Documents</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={generateProposal}
            className="flex flex-col items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 transition-all hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="text-white font-medium text-sm">Contract Proposal</div>
            <div className="text-gray-400 text-xs">Pricing & Terms</div>
          </button>
          <button
            onClick={generateTechSpec}
            className="flex flex-col items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 transition-all hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div className="text-white font-medium text-sm">Technical Specs</div>
            <div className="text-gray-400 text-xs">System Details</div>
          </button>
        </div>
        <p className="text-gray-500 text-xs text-center mt-3">
          Click to view, then use Ctrl+P / Cmd+P to save as PDF
        </p>
      </div>

      {/* What's Next */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold text-lg mb-4">What&apos;s Next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-semibold">1</span>
            </div>
            <div>
              <div className="text-white font-medium">We&apos;ll Call You</div>
              <div className="text-gray-400 text-sm">Our team will contact you within 24 hours to discuss your quote</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-semibold">2</span>
            </div>
            <div>
              <div className="text-white font-medium">Site Visit</div>
              <div className="text-gray-400 text-sm">We&apos;ll schedule a free site visit to finalize the design</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-semibold">3</span>
            </div>
            <div>
              <div className="text-white font-medium">Installation in 14 Days</div>
              <div className="text-gray-400 text-sm">Once approved, installation takes just 1-2 days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Contract Now - Only show if signing URL available */}
      {state.contractSigningUrl && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-2xl p-6 mb-6">
          <div className="text-center mb-4">
            <h3 className="text-white font-bold text-xl mb-2">Ready to Proceed?</h3>
            <p className="text-gray-300 text-sm">
              Sign your contract online and pay your deposit to secure your installation slot!
            </p>
          </div>
          <a
            href={state.contractSigningUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg">Sign Contract Now</span>
          </a>
          <p className="text-gray-400 text-xs text-center mt-3">
            30% deposit secures your installation date
          </p>
        </div>
      )}

      {/* Primary CTA - WhatsApp */}
      <div className="bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/20 border border-[#25D366]/40 rounded-2xl p-6 mb-6">
        <div className="text-center mb-4">
          <h3 className="text-white font-bold text-xl mb-2">Ready to Go Solar?</h3>
          <p className="text-gray-300 text-sm">
            Message us now and we&apos;ll fast-track your installation!
          </p>
        </div>
        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#20bd5a] hover:scale-[1.02] transition-all shadow-lg shadow-[#25D366]/25"
        >
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-lg">Chat on WhatsApp</span>
        </button>
        <button
          onClick={handleCall}
          className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white font-medium py-3 mt-3 transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>Or call +356 7905 5156</span>
        </button>
      </div>

      {/* Email Copy */}
      <div className="text-center text-gray-400 text-sm">
        A copy of this quote has been sent to <span className="text-white">{state.email}</span>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
