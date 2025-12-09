import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { WizardState, SystemPackage, BatteryOption } from './types';

interface ProposalData {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  quoteRef: string;
  date: string;

  // System details
  system: SystemPackage | null;
  battery: BatteryOption | null;
  isBatteryOnly: boolean;

  // Pricing
  totalPrice: number;
  grantAmount: number;
  grossPrice: number;

  // Financials
  annualSavings: number;
  paybackYears: number;
  paymentMethod: string;
  monthlyPayment: number | null;
  loanTerm: number | null;

  // Location
  location: 'malta' | 'gozo';
}

export async function generateProposalPdfWithPdfLib(data: ProposalData): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();

    // Load fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Colors
  const black = rgb(0.1, 0.1, 0.18); // #1a1a2e
  const amber = rgb(0.96, 0.62, 0.04); // #f59e0b
  const purple = rgb(0.55, 0.36, 0.96); // #8b5cf6
  const green = rgb(0.09, 0.64, 0.29); // #16a34a
  const gray = rgb(0.4, 0.4, 0.4);

  const primaryColor = data.isBatteryOnly ? purple : amber;
  let yPosition = height - 60;

  // Header
  page.drawText('Ghawde', {
    x: 50,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: amber,
  });
  page.drawText('X', {
    x: 118,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: black,
  });

  page.drawText('Engineering Excellence in Energy Storage', {
    x: 50,
    y: yPosition - 15,
    size: 9,
    font: fontRegular,
    color: gray,
  });

  // Quote reference (right aligned)
  page.drawText('CONTRACT PROPOSAL', {
    x: width - 200,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: black,
  });
  page.drawText(`Ref: ${data.quoteRef}`, {
    x: width - 200,
    y: yPosition - 15,
    size: 9,
    font: fontRegular,
    color: gray,
  });
  page.drawText(`Date: ${data.date}`, {
    x: width - 200,
    y: yPosition - 28,
    size: 9,
    font: fontRegular,
    color: gray,
  });
  page.drawText('Valid for: 30 days', {
    x: width - 200,
    y: yPosition - 41,
    size: 9,
    font: fontRegular,
    color: gray,
  });

  // Header line
  yPosition -= 50;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: primaryColor,
  });

  // Title
  yPosition -= 35;
  page.drawText(
    data.isBatteryOnly ? 'Battery Storage Proposal' : 'Solar System Proposal',
    {
      x: 50,
      y: yPosition,
      size: 20,
      font: fontBold,
      color: black,
    }
  );

  yPosition -= 20;
  page.drawText(
    data.isBatteryOnly
      ? 'Thank you for choosing GhawdeX Engineering for your battery storage installation.'
      : 'Thank you for choosing GhawdeX Engineering for your solar energy installation.',
    {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: gray,
      maxWidth: width - 100,
    }
  );

  // Customer Info Box
  yPosition -= 35;
  page.drawRectangle({
    x: 50,
    y: yPosition - 50,
    width: width - 100,
    height: 50,
    color: rgb(0.97, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  page.drawText(`Customer: ${data.customerName}`, {
    x: 60,
    y: yPosition - 20,
    size: 10,
    font: fontRegular,
    color: black,
  });
  page.drawText(`Email: ${data.email}`, {
    x: 60,
    y: yPosition - 35,
    size: 10,
    font: fontRegular,
    color: black,
  });
  page.drawText(`Phone: ${data.phone}`, {
    x: width / 2 + 10,
    y: yPosition - 20,
    size: 10,
    font: fontRegular,
    color: black,
  });
  page.drawText(`Address: ${data.address}`, {
    x: width / 2 + 10,
    y: yPosition - 35,
    size: 10,
    font: fontRegular,
    color: black,
  });

  // Price Box
  yPosition -= 85;
  page.drawRectangle({
    x: 50,
    y: yPosition - 70,
    width: width - 100,
    height: 70,
    color: data.isBatteryOnly ? rgb(0.93, 0.91, 0.99) : rgb(0.99, 0.97, 0.93),
    borderColor: primaryColor,
    borderWidth: 2,
  });

  page.drawText('TOTAL INVESTMENT', {
    x: width / 2 - 70,
    y: yPosition - 20,
    size: 11,
    font: fontBold,
    color: data.isBatteryOnly ? purple : amber,
  });

  page.drawText(`€${data.totalPrice.toLocaleString('en-MT', { minimumFractionDigits: 2 })}`, {
    x: width / 2 - 60,
    y: yPosition - 45,
    size: 28,
    font: fontBold,
    color: black,
  });

  if (data.grantAmount > 0) {
    page.drawText(`€${data.grantAmount.toLocaleString('en-MT')} grant applied`, {
      x: width / 2 - 50,
      y: yPosition - 60,
      size: 10,
      font: fontRegular,
      color: green,
    });
  }

  // System Configuration Section
  yPosition -= 100;
  page.drawText('System Configuration', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: primaryColor,
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  yPosition -= 20;

  if (data.isBatteryOnly && data.battery) {
    // Battery-only configuration
    page.drawText(`Battery Capacity: ${data.battery.capacityKwh} kWh`, {
      x: 60,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: black,
    });
    yPosition -= 18;
    page.drawText(`Model: ${data.battery.name}`, {
      x: 60,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: black,
    });
    yPosition -= 18;
    page.drawText('Includes: Hybrid Inverter for seamless integration', {
      x: 60,
      y: yPosition,
      size: 10,
      font: fontRegular,
      color: gray,
    });
  } else if (data.system) {
    // Solar system configuration
    page.drawText(`System Size: ${data.system.systemSizeKw} kWp`, {
      x: 60,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: black,
    });
    yPosition -= 18;
    page.drawText(`Solar Panels: ${data.system.panels} x ${data.system.panelWattage}W (Total: ${data.system.systemSizeKw} kWp)`, {
      x: 60,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: black,
    });
    yPosition -= 18;
    page.drawText(`Panel Brand: Huawei (Premium Tier 1)`, {
      x: 60,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: black,
    });
    yPosition -= 18;
    page.drawText(`Inverter: ${data.system.inverterModel}`, {
      x: 60,
      y: yPosition,
      size: 11,
      font: fontRegular,
      color: black,
    });

    if (data.battery) {
      yPosition -= 18;
      page.drawText(`Battery: ${data.battery.name} (${data.battery.capacityKwh} kWh)`, {
        x: 60,
        y: yPosition,
        size: 11,
        font: fontRegular,
        color: black,
      });
    }
  }

  // Financial Summary
  yPosition -= 35;
  page.drawText('Financial Summary', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: primaryColor,
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  yPosition -= 25;

  // Financial table
  const drawTableRow = (label: string, value: string, y: number, isBold: boolean = false) => {
    page.drawText(label, {
      x: 60,
      y,
      size: 10,
      font: isBold ? fontBold : fontRegular,
      color: black,
    });
    page.drawText(value, {
      x: width - 200,
      y,
      size: 10,
      font: isBold ? fontBold : fontRegular,
      color: black,
    });
  };

  if (!data.isBatteryOnly && data.system) {
    drawTableRow('Annual Energy Production', `${data.system.annualProductionKwh.toLocaleString()} kWh`, yPosition);
    yPosition -= 18;
  }

  drawTableRow('Annual Savings', `€${data.annualSavings.toLocaleString()}`, yPosition);
  yPosition -= 18;
  drawTableRow('Payback Period', `${data.paybackYears} years`, yPosition);
  yPosition -= 18;
  drawTableRow('Payment Method', data.paymentMethod === 'loan' ? `BOV Financing (${data.loanTerm ? data.loanTerm / 12 : 0} years)` : 'Pay in Full', yPosition);

  if (data.monthlyPayment) {
    yPosition -= 18;
    drawTableRow('Monthly Payment', `€${data.monthlyPayment.toLocaleString()}/month`, yPosition, true);
  }

  // Grant Section
  yPosition -= 35;
  page.drawText('Government Grant (REWS 2025)', {
    x: 50,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: primaryColor,
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  yPosition -= 25;

  const grantPercentage = data.location === 'gozo' ? '95%' : '80%';
  const locationName = data.location === 'gozo' ? 'Gozo' : 'Malta';

  drawTableRow('Grant Scheme', data.isBatteryOnly ? 'Battery Storage Grant' : 'PV System + Battery Grant', yPosition);
  yPosition -= 18;
  drawTableRow('Location', `${locationName} (${grantPercentage} battery subsidy)`, yPosition);
  yPosition -= 18;
  drawTableRow('Grant Amount', `€${data.grantAmount.toLocaleString()}`, yPosition, true);
  yPosition -= 18;
  drawTableRow('Customer Pays', `€${data.totalPrice.toLocaleString()}`, yPosition, true);

  // Terms & Conditions
  yPosition -= 35;
  page.drawText('Important Terms', {
    x: 50,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: black,
  });

  yPosition -= 18;
  const terms = [
    '• Prices include VAT (18%) and all installation costs',
    '• Grant applications processed by GhawdeX on your behalf',
    '• 25-year performance warranty on solar panels',
    '• 10-year product warranty on inverter and battery',
    '• Installation within 4-6 weeks of contract signing',
    '• Site survey required before final installation',
  ];

  terms.forEach((term) => {
    page.drawText(term, {
      x: 60,
      y: yPosition,
      size: 9,
      font: fontRegular,
      color: gray,
    });
    yPosition -= 14;
  });

  // Footer
  yPosition = 60;
  page.drawLine({
    start: { x: 50, y: yPosition + 10 },
    end: { x: width - 50, y: yPosition + 10 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText('GhawdeX Engineering Ltd', {
    x: width / 2 - 70,
    y: yPosition - 5,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });
  page.drawText('Phone: +356 7905 5156 | Email: info@ghawdex.pro | www.ghawdex.pro', {
    x: width / 2 - 150,
    y: yPosition - 20,
    size: 8,
    font: fontRegular,
    color: gray,
  });

    return await pdfDoc.save();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
