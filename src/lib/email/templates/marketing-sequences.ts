/**
 * Marketing Email Sequences
 *
 * Three pillars based on lead behavior and source:
 * - SPEED: For leads interested in fast installation (14-day guarantee)
 * - GRANTS: For leads interested in savings/grant (€10,200 focus)
 * - NURTURE: For cold leads, low engagement (educational content)
 */

interface MarketingEmailData {
  name: string;
  isGozo?: boolean;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const COMPANY_PHONE = '+356 7905 5156';
const WHATSAPP_LINK = 'https://wa.me/35679055156';
const WEBSITE = 'https://get.ghawdex.pro';

/**
 * Generate marketing email based on sequence and step
 */
export function generateMarketingEmail(
  emailType: string,
  data: MarketingEmailData
): EmailContent {
  const firstName = data.name?.split(' ')[0] || 'there';

  switch (emailType) {
    // SPEED PILLAR
    case 'speed-1':
      return generateSpeed1(firstName);
    case 'speed-2':
      return generateSpeed2(firstName);
    case 'speed-3':
      return generateSpeed3(firstName);

    // GRANTS PILLAR
    case 'grants-1':
      return generateGrants1(firstName, data.isGozo);
    case 'grants-2':
      return generateGrants2(firstName);
    case 'grants-3':
      return generateGrants3(firstName);

    // NURTURE PILLAR
    case 'nurture-1':
      return generateNurture1(firstName);
    case 'nurture-2':
      return generateNurture2(firstName);
    case 'nurture-3':
      return generateNurture3(firstName);

    default:
      throw new Error(`Unknown marketing email type: ${emailType}`);
  }
}

// =============================================================================
// SPEED PILLAR - Fast Installation Focus
// =============================================================================

function generateSpeed1(firstName: string): EmailContent {
  const subject = 'Your 14-day solar installation starts now';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .timeline { background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .timeline-item { margin: 12px 0; padding-left: 30px; position: relative; }
    .timeline-item:before { content: ""; position: absolute; left: 8px; top: 8px; width: 10px; height: 10px; background: #16a34a; border-radius: 50%; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Thanks for reaching out about solar!</p>

    <p>You're probably tired of hearing "6-12 weeks" from other companies.</p>

    <p>We get it. That's why we built our entire process around speed.</p>

    <p><strong>Here's your 14-day journey with GhawdeX:</strong></p>

    <div class="timeline">
      <div class="timeline-item"><strong>Days 1-2:</strong> Free site assessment (we come to you, takes 2 hours)</div>
      <div class="timeline-item"><strong>Days 3-5:</strong> Grant paperwork submitted (we handle everything)</div>
      <div class="timeline-item"><strong>Days 6-13:</strong> Installation scheduled (1-2 days on-site)</div>
      <div class="timeline-item"><strong>Day 14:</strong> System activated, you're generating power</div>
    </div>

    <p>No waiting. No delays. No excuses.</p>

    <p style="text-align: center;">
      <a href="${WEBSITE}" class="cta">Book Your Free Assessment</a>
    </p>

    <p>Questions? Just reply to this email.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <p style="color: #6b7280; font-size: 14px;">
      P.S. - We also help you claim the full €10,200 government grant. More on that later.
    </p>

    <div class="footer">
      <p>GhawdeX Solar<br>
      <a href="${WEBSITE}">${WEBSITE}</a> | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Thanks for reaching out about solar!

You're probably tired of hearing "6-12 weeks" from other companies. We get it. That's why we built our entire process around speed.

Here's your 14-day journey with GhawdeX:
- Days 1-2: Free site assessment (we come to you)
- Days 3-5: Grant paperwork submitted (we handle everything)
- Days 6-13: Installation scheduled (1-2 days on-site)
- Day 14: System activated, you're generating power

No waiting. No delays. No excuses.

Ready to start your countdown?
${WEBSITE}

Questions? Just reply to this email.

Best,
The GhawdeX Team

P.S. - We also help you claim the full €10,200 government grant.

---
GhawdeX Solar | ${WEBSITE} | ${COMPANY_PHONE}
  `.trim();

  return { subject, html, text };
}

function generateSpeed2(firstName: string): EmailContent {
  const subject = '"They did it in 14 days. I thought they were joking." - Maria, Gozo';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .testimonial { background: #f8fafc; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; font-style: italic; }
    .testimonial-author { font-style: normal; font-weight: 600; margin-top: 10px; }
    .reasons { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Don't just take our word for it.</p>

    <p>Here's what Maria from Gozo said about our 14-day guarantee:</p>

    <div class="testimonial">
      "I called three companies. Two said 8 weeks minimum. One said 12 weeks.<br><br>
      GhawdeX said 14 days. I thought they were joking.<br><br>
      They weren't. Exactly 14 days later, my solar was generating power."
      <div class="testimonial-author">- Maria R., Gozo</div>
    </div>

    <p>And Paul from Sliema:</p>

    <div class="testimonial">
      "The assessment took 2 hours. Installation took 1.5 days. Everything else happened in the background.<br><br>
      I barely had to do anything. Just signed a few forms and boom - solar."
      <div class="testimonial-author">- Paul M., Sliema</div>
    </div>

    <div class="reasons">
      <p><strong>Why are we so much faster?</strong></p>
      <ol style="margin: 0; padding-left: 20px;">
        <li>We keep panels in stock (no 6-week shipping delays)</li>
        <li>We have 3 dedicated installation crews</li>
        <li>We handle ALL grant paperwork (you don't wait on bureaucracy)</li>
        <li>We schedule everything in advance (no last-minute reschedules)</li>
      </ol>
    </div>

    <p><strong>Ready to be our next success story?</strong></p>

    <p style="text-align: center;">
      <a href="${WEBSITE}" class="cta">Book Your Free Assessment</a>
    </p>

    <p>Questions? Reply to this email or WhatsApp us: ${COMPANY_PHONE}</p>

    <p>Best,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Don't just take our word for it.

Here's what Maria from Gozo said about our 14-day guarantee:

"I called three companies. Two said 8 weeks minimum. One said 12 weeks. GhawdeX said 14 days. I thought they were joking. They weren't. Exactly 14 days later, my solar was generating power."
- Maria R., Gozo

And Paul from Sliema:

"The assessment took 2 hours. Installation took 1.5 days. Everything else happened in the background. I barely had to do anything."
- Paul M., Sliema

Why are we so much faster?
1. We keep panels in stock (no 6-week shipping delays)
2. We have 3 dedicated installation crews
3. We handle ALL grant paperwork
4. We schedule everything in advance

Ready to be our next success story?
${WEBSITE}

Questions? Reply or WhatsApp: ${COMPANY_PHONE}

Best,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateSpeed3(firstName: string): EmailContent {
  const subject = 'Ready to start your 14-day solar installation?';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .objections { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .objection { margin: 10px 0; }
    .steps { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Quick question: What's stopping you from starting your solar journey?</p>

    <div class="objections">
      <div class="objection">Cost? <strong>Government grant covers €10,200</strong></div>
      <div class="objection">Time? <strong>We do it in 14 days, not 3 months</strong></div>
      <div class="objection">Hassle? <strong>We handle 100% of paperwork</strong></div>
      <div class="objection">Not sure if it's worth it? <strong>Average customer saves €45,000 over 25 years</strong></div>
    </div>

    <p>Whatever it is, I can help answer.</p>

    <div class="steps">
      <p><strong>Here's what happens next if you book your free assessment:</strong></p>
      <ol style="margin: 0; padding-left: 20px;">
        <li>We visit your property (2 hours, completely free)</li>
        <li>We calculate your exact savings & grant eligibility</li>
        <li>We give you a quote (no obligation)</li>
        <li>If you say yes, we start your 14-day installation</li>
      </ol>
    </div>

    <p><strong>If you say no?</strong> No problem. No pressure. No follow-ups.</p>

    <p style="text-align: center;">
      <a href="${WEBSITE}" class="cta">Book Your Free Assessment</a>
    </p>

    <p>Or just reply with your questions.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a> | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Quick question: What's stopping you from starting your solar journey?

Is it:
- Cost? Government grant covers €10,200
- Time? We do it in 14 days, not 3 months
- Hassle? We handle 100% of paperwork
- Not sure if it's worth it? Average customer saves €45,000 over 25 years

Whatever it is, I can help answer.

Here's what happens next if you book your free assessment:
1. We visit your property (2 hours, completely free)
2. We calculate your exact savings & grant eligibility
3. We give you a quote (no obligation)
4. If you say yes, we start your 14-day installation

If you say no? No problem. No pressure. No follow-ups.

Ready? ${WEBSITE}

Or just reply with your questions.

Best,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

// =============================================================================
// GRANTS PILLAR - €10,200 Savings Focus
// =============================================================================

function generateGrants1(firstName: string, isGozo?: boolean): EmailContent {
  const subject = 'How to claim your €10,200 solar grant (we do the work)';

  const grantDetails = isGozo
    ? `<p><strong>GOZO EXCLUSIVE:</strong> Your battery grant is 95% covered! A €9,000 battery costs you just €449.</p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .grant-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .example { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .highlight { font-size: 24px; font-weight: 700; color: #16a34a; }
    .cta { display: inline-block; background: #f59e0b; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Let's talk about that €10,200 government grant.</p>

    <div class="grant-box">
      <p style="margin: 0;"><strong>Grant Amount:</strong> Up to €10,200 (yes, really)</p>
      <p style="margin: 10px 0 0;"><strong>Covers:</strong> ~60-70% of your total system cost</p>
      <p style="margin: 10px 0 0;"><strong>Application:</strong> We handle 100% of the paperwork</p>
      <p style="margin: 10px 0 0;"><strong>Approval Time:</strong> 6-8 weeks (we manage everything)</p>
    </div>

    ${grantDetails}

    <div class="example">
      <p><strong>Here's what it looks like for a typical home:</strong></p>
      <p>Total system cost: €15,000<br>
      Government grant: -€10,200<br>
      <span class="highlight">Your actual cost: €4,800</span></p>

      <p style="margin-top: 15px;">
      Monthly electricity savings: €120-180<br>
      Payback period: ~2-3 years<br>
      25-year savings: €45,000+</p>
    </div>

    <p><strong>The best part?</strong> We handle ALL the grant paperwork for you.</p>

    <p>You sign a few forms. We do the rest.</p>

    <p style="text-align: center;">
      <a href="${WEBSITE}" class="cta">Calculate My Savings & Grant</a>
    </p>

    <p>Or reply with your questions.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <p style="color: #dc2626; font-size: 14px;">
      P.S. - Grants are first-come, first-served. Once the budget runs out, they're gone.
    </p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a> | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Let's talk about that €10,200 government grant.

Grant Amount: Up to €10,200 (yes, really)
Covers: ~60-70% of your total system cost
Application: We handle 100% of the paperwork
Approval Time: 6-8 weeks (we manage everything)

Here's what it looks like for a typical home:

Total system cost: €15,000
Government grant: -€10,200
YOUR ACTUAL COST: €4,800

Monthly electricity savings: €120-180
Payback period: ~2-3 years
25-year savings: €45,000+

The best part? We handle ALL the grant paperwork for you.

You sign a few forms. We do the rest.

Want to see YOUR exact numbers?
${WEBSITE}

Or reply with your questions.

Best,
The GhawdeX Team

P.S. - Grants are first-come, first-served. Once the budget runs out, they're gone.
  `.trim();

  return { subject, html, text };
}

function generateGrants2(firstName: string): EmailContent {
  const subject = 'The exact process to claim your €10,200 grant (we handle it)';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .step { background: #f8fafc; border-left: 4px solid #16a34a; padding: 15px 20px; margin: 15px 0; }
    .step-title { font-weight: 700; color: #16a34a; margin-bottom: 5px; }
    .checklist { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .check { color: #16a34a; margin-right: 8px; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Here's exactly how we get you the €10,200 grant:</p>

    <div class="step">
      <div class="step-title">STEP 1: Free Assessment</div>
      We visit your property and measure your roof, energy usage, etc. (Takes 2 hours)
    </div>

    <div class="step">
      <div class="step-title">STEP 2: Grant Calculation</div>
      We calculate your exact grant amount (usually €8,000-10,200 depending on system size)
    </div>

    <div class="step">
      <div class="step-title">STEP 3: Paperwork Submission</div>
      We fill out and submit ALL grant application forms. You just sign where we tell you. (Takes 1-2 days)
    </div>

    <div class="step">
      <div class="step-title">STEP 4: Installation</div>
      While the grant is being processed, we install your solar system. (14-day process)
    </div>

    <div class="step">
      <div class="step-title">STEP 5: Grant Approval</div>
      Government approves grant (6-8 weeks). Money gets paid directly to you or deducted from your invoice.
    </div>

    <div class="step">
      <div class="step-title">STEP 6: You Save Money</div>
      Your solar is generating power. Your bills drop. You save €1,800-2,400/year.
    </div>

    <div class="checklist">
      <p><strong>You don't need to do anything except sign a few forms.</strong></p>
      <p>We handle:</p>
      <p><span class="check">✓</span> All grant paperwork</p>
      <p><span class="check">✓</span> All government submissions</p>
      <p><span class="check">✓</span> All follow-ups & tracking</p>
      <p><span class="check">✓</span> All technical requirements</p>
    </div>

    <p style="text-align: center;">
      <a href="${WEBSITE}" class="cta">Book Your Free Assessment</a>
    </p>

    <p>Questions? Reply to this email.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a> | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Here's exactly how we get you the €10,200 grant:

STEP 1: Free Assessment
We visit your property and measure your roof, energy usage, etc. (Takes 2 hours)

STEP 2: Grant Calculation
We calculate your exact grant amount (usually €8,000-10,200 depending on system size)

STEP 3: Paperwork Submission
We fill out and submit ALL grant application forms. You just sign where we tell you.

STEP 4: Installation
While the grant is being processed, we install your solar system. (14-day process)

STEP 5: Grant Approval
Government approves grant (6-8 weeks). Money gets paid directly to you or deducted from your invoice.

STEP 6: You Save Money
Your solar is generating power. Your bills drop. You save €1,800-2,400/year.

You don't need to do anything except sign a few forms.

We handle:
✓ All grant paperwork
✓ All government submissions
✓ All follow-ups & tracking
✓ All technical requirements

Ready to start?
${WEBSITE}

Questions? Reply to this email.

Best,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateGrants3(firstName: string): EmailContent {
  const subject = 'Government grant budget is running out (lock yours in now)';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .urgent { background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .status { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .check { color: #16a34a; margin-right: 8px; }
    .steps { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta { display: inline-block; background: #dc2626; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Quick heads up:</p>

    <div class="urgent">
      <p style="margin: 0; font-weight: 700; color: #dc2626;">
        The €10,200 government grant is first-come, first-served.
      </p>
      <p style="margin: 10px 0 0;">
        Once the budget runs out, it's gone until next year (maybe).
      </p>
    </div>

    <div class="status">
      <p><strong>Right now:</strong></p>
      <p><span class="check">✓</span> Grant is available</p>
      <p><span class="check">✓</span> Applications are being approved</p>
      <p><span class="check">✓</span> We can submit yours within 48 hours</p>
    </div>

    <div class="steps">
      <p><strong>Even if you're not ready to install immediately</strong>, you should at least:</p>
      <ol style="margin: 0; padding-left: 20px;">
        <li>Get your quote (free)</li>
        <li>Submit your grant application (locks in your €10,200)</li>
        <li>Schedule installation when you're ready</li>
      </ol>
      <p style="margin-top: 15px;"><strong>This way, your grant is secured even if the budget runs out.</strong></p>
    </div>

    <p>Don't leave €10,200 on the table.</p>

    <p style="text-align: center;">
      <a href="${WEBSITE}" class="cta">Calculate My Grant & Savings</a>
    </p>

    <p>Or reply if you have questions.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <p style="color: #dc2626; font-size: 14px;">
      P.S. - We've had customers lose out on grants because they waited too long. Don't let that be you.
    </p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a> | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Quick heads up:

The €10,200 government grant is FIRST-COME, FIRST-SERVED.

Once the budget runs out, it's gone until next year (maybe).

Right now:
✓ Grant is available
✓ Applications are being approved
✓ We can submit yours within 48 hours

Even if you're not ready to install immediately, you should at least:
1. Get your quote (free)
2. Submit your grant application (locks in your €10,200)
3. Schedule installation when you're ready

This way, your grant is secured even if the budget runs out.

Don't leave €10,200 on the table.
${WEBSITE}

Or reply if you have questions.

Best,
The GhawdeX Team

P.S. - We've had customers lose out on grants because they waited too long. Don't let that be you.
  `.trim();

  return { subject, html, text };
}

// =============================================================================
// NURTURE PILLAR - Educational Content for Cold Leads
// =============================================================================

function generateNurture1(firstName: string): EmailContent {
  const subject = 'Calculate your solar savings in 60 seconds (free tool)';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .tool-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
    .tool-title { font-size: 20px; font-weight: 700; color: #16a34a; margin-bottom: 15px; }
    .inputs { text-align: left; margin: 20px 0; }
    .outputs { background: #fff; padding: 15px; border-radius: 8px; margin-top: 15px; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>Not ready to book an assessment yet? No problem.</p>

    <p>Here's a free tool to help you explore solar on your own time:</p>

    <div class="tool-box">
      <div class="tool-title">60-Second Solar Calculator</div>

      <div class="inputs">
        <p><strong>Enter:</strong></p>
        <p>• Your monthly electricity bill<br>
        • Your property type (house/apartment)<br>
        • Your location (Malta/Gozo)</p>
      </div>

      <div class="outputs">
        <p><strong>Get:</strong></p>
        <p>• Your estimated savings (monthly & yearly)<br>
        • Your grant amount (up to €10,200)<br>
        • Your payback period<br>
        • Your 25-year total savings</p>
      </div>

      <p style="margin-top: 20px;">
        <a href="${WEBSITE}" class="cta">Try the Calculator</a>
      </p>

      <p style="font-size: 14px; color: #6b7280; margin: 0;">
        No email required. No sales call. Just free information.
      </p>
    </div>

    <p>Questions? Reply anytime.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

Not ready to book an assessment yet? No problem.

Here's a free tool to help you explore solar on your own time:

60-SECOND SOLAR CALCULATOR
${WEBSITE}

Enter:
• Your monthly electricity bill
• Your property type (house/apartment)
• Your location (Malta/Gozo)

Get:
• Your estimated savings (monthly & yearly)
• Your grant amount (up to €10,200)
• Your payback period
• Your 25-year total savings

No email required. No sales call. Just free information.

Questions? Reply anytime.

Best,
The GhawdeX Team
  `.trim();

  return { subject, html, text };
}

function generateNurture2(firstName: string): EmailContent {
  const subject = "What's stopping you from going solar?";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .concerns { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .concern { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .concern:last-child { border-bottom: none; }
    .concern strong { color: #16a34a; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>I noticed you inquired about solar last week but haven't taken the next step.</p>

    <p>I'm curious - what's holding you back?</p>

    <div class="concerns">
      <div class="concern">
        <strong>Too expensive?</strong><br>
        Grant covers 60-70%
      </div>
      <div class="concern">
        <strong>Takes too long?</strong><br>
        We do it in 14 days
      </div>
      <div class="concern">
        <strong>Too complicated?</strong><br>
        We handle everything
      </div>
      <div class="concern">
        <strong>Not sure it's worth it?</strong><br>
        Average ROI: 2-3 years
      </div>
      <div class="concern">
        <strong>Something else?</strong>
      </div>
    </div>

    <p><strong>Reply to this email and tell me what's stopping you.</strong></p>

    <p>I'm not going to pitch you. I just want to understand.</p>

    <p>If I can answer your concern, great. If not, no worries.</p>

    <p>Best,<br>The GhawdeX Team</p>

    <p style="color: #6b7280;">
      P.S. - Seriously, just reply with one word. I'll take it from there.
    </p>

    <div class="footer">
      <p>GhawdeX Solar | <a href="${WEBSITE}">${WEBSITE}</a> | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

I noticed you inquired about solar last week but haven't taken the next step.

I'm curious - what's holding you back?

Is it:
- Too expensive? (Grant covers 60-70%)
- Takes too long? (We do it in 14 days)
- Too complicated? (We handle everything)
- Not sure it's worth it? (Average ROI: 2-3 years)
- Something else?

Reply to this email and tell me what's stopping you.

I'm not going to pitch you. I just want to understand.

If I can answer your concern, great. If not, no worries.

Best,
The GhawdeX Team

P.S. - Seriously, just reply with one word. I'll take it from there.
  `.trim();

  return { subject, html, text };
}

function generateNurture3(firstName: string): EmailContent {
  const subject = 'This is our last email (but you need to see this first)';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
    .video-box { background: #1a1a2e; color: #fff; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .video-title { font-size: 18px; margin-bottom: 15px; }
    .video-points { text-align: left; margin: 20px 0; }
    .cta { display: inline-block; background: #16a34a; color: #fff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${firstName},</p>

    <p>This is my last email (promise).</p>

    <p>But before I stop bothering you, I want to show you something:</p>

    <div class="video-box">
      <div class="video-title">2-Minute Customer Testimonial Video</div>

      <div class="video-points">
        <p>Maria from Gozo shares:</p>
        <p>• Why she was skeptical about solar<br>
        • What made her finally take the leap<br>
        • How much money she's saving now<br>
        • Why she wishes she did it sooner</p>
      </div>

      <p style="font-size: 14px; opacity: 0.8;">2 minutes. That's it.</p>

      <a href="${WEBSITE}" class="cta">Watch the 2-Minute Video</a>
    </div>

    <p>If you watch it and still aren't interested, I'll stop emailing you.</p>

    <p>Fair?</p>

    <p>Best,<br>The GhawdeX Team</p>

    <p style="color: #6b7280;">
      P.S. - If you want to reconnect in the future, just reply to this email or visit <a href="${WEBSITE}">${WEBSITE}</a>
    </p>

    <div class="footer">
      <p>GhawdeX Solar | ${COMPANY_PHONE}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${firstName},

This is my last email (promise).

But before I stop bothering you, I want to show you something:

2-MINUTE CUSTOMER TESTIMONIAL VIDEO

Maria from Gozo shares:
• Why she was skeptical about solar
• What made her finally take the leap
• How much money she's saving now
• Why she wishes she did it sooner

2 minutes. That's it.

Watch here: ${WEBSITE}

If you watch it and still aren't interested, I'll stop emailing you.

Fair?

Best,
The GhawdeX Team

P.S. - If you want to reconnect in the future, just reply to this email or visit ${WEBSITE}
  `.trim();

  return { subject, html, text };
}
