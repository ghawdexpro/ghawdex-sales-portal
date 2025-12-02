# Plan: Complete Lead Data & PDF Storage

## Current Status (Last Updated: 2025-12-02)

### COMPLETED:
- [x] Database migrations (grant_type, grant_amount, proposal_file_url) - **NEEDS MANUAL RUN** - see SQL below
- [x] Create proposals storage bucket - **NEEDS MANUAL RUN** - see SQL below
- [x] Update types.ts (Lead + WizardState) - Added grant_type, grant_amount, proposal_file_url, proposalFileUrl
- [x] Update WizardContext.tsx - Added SET_PROPOSAL_URL action
- [x] Create upload/proposal API route - `/src/app/api/upload/proposal/route.ts`
- [x] Update leads API route - Added grant_type, grant_amount, proposal_file_url + email-based PATCH lookup
- [x] Update zoho.ts - Added Grant_Type, Grant_Amount, Proposal_URL fields
- [x] Update Step5Contact.tsx - Added grant calculation and sends grant_type + grant_amount
- [x] Install html2pdf.js - `npm install html2pdf.js` done
- [x] Update Step6Summary.tsx - Added PDF generation + upload, grant_amount to prefilled lead

### PENDING:
- [x] Fix avatar cron route type error - DONE
- [x] Run build to verify no errors - DONE (build passes)
- [ ] **DATABASE MIGRATION** - NEEDS MANUAL RUN (see SQL below)
- [ ] Test all flows
- [ ] Deploy to Railway

---

## MANUAL DATABASE STEPS REQUIRED

Run this SQL in Supabase Dashboard > SQL Editor (Project: lccebuetwhezxpviyfrs):

```sql
-- 1. Add columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS grant_type TEXT DEFAULT 'pv_only',
ADD COLUMN IF NOT EXISTS grant_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS proposal_file_url TEXT;

-- 2. Create proposals storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow public uploads to proposals bucket (RLS policy)
CREATE POLICY "Allow public uploads to proposals" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'proposals');

CREATE POLICY "Allow public read from proposals" ON storage.objects
FOR SELECT USING (bucket_id = 'proposals');
```

---

## Files Modified

| File | Status | Changes |
|------|--------|---------|
| `src/lib/types.ts` | ✅ Done | Added grant_type, grant_amount, proposal_file_url to Lead; proposalFileUrl to WizardState |
| `src/components/wizard/WizardContext.tsx` | ✅ Done | Added SET_PROPOSAL_URL action + reducer case |
| `src/app/api/upload/proposal/route.ts` | ✅ Done | NEW - PDF upload endpoint |
| `src/app/api/leads/route.ts` | ✅ Done | Added new fields to POST + email-based PATCH lookup |
| `src/lib/zoho.ts` | ✅ Done | Added Grant_Type, Grant_Amount, Proposal_URL to interface and mapping |
| `src/components/wizard/steps/Step5Contact.tsx` | ✅ Done | Added grant calculation + sends grant_type/grant_amount |
| `src/components/wizard/steps/Step6Summary.tsx` | ✅ Done | Added uploadProposalPdf function, grant_amount to prefilled lead |
| `src/app/api/cron/avatar-auto-save/route.ts` | ✅ Done | Added grant_type, grant_amount, proposal_file_url to leadData |

---

## Key Code Changes Summary

### Step5Contact.tsx
- Added import: `import { calculateTotalPriceWithGrant } from '@/lib/calculations';`
- Added price calculation before POST:
```typescript
const priceDetails = state.selectedSystem
  ? calculateTotalPriceWithGrant(
      state.selectedSystem.systemSizeKw,
      state.grantPath,
      state.isGozo,
      state.withBattery,
      state.batterySize || undefined,
      state.grantType
    )
  : null;
```
- Added to POST body:
```typescript
grant_type: state.grantType,
grant_amount: priceDetails?.grantAmount || null,
```

### Step6Summary.tsx
- Added imports: `useCallback` from react
- Added state: `pdfUploading`, `pdfUploaded`, `pdfUploadedRef`
- Added `uploadProposalPdf` callback function that:
  1. Dynamically imports html2pdf.js
  2. Generates PDF blob from HTML
  3. Uploads to `/api/upload/proposal`
  4. Dispatches SET_PROPOSAL_URL
  5. Updates lead via PATCH with proposal_file_url
- Modified `generateProposal` to call `uploadProposalPdf(html)` after opening print window
- Added `grant_amount: displayGrantAmount` to prefilled lead POST body

### API Route (leads)
- PATCH now supports email-based lookup (not just id)
- If no `id` provided but `email` is, looks up lead by email first

---

## Recovery Instructions

If Claude crashes, continue with:

1. **Run build**: `npm run build` - check for TypeScript errors
2. **Run database migrations** - use SQL above in Supabase Dashboard
3. **Test locally**: `npm run dev` - test Step5 and Step6 flows
4. **Deploy**: `git push origin main && /opt/homebrew/bin/railway up`

---

## Goal Recap
1. Save `grant_type` and `grant_amount` to Supabase and Zoho CRM ✅
2. Upload proposal PDFs to Supabase storage and link to leads/Zoho ✅
