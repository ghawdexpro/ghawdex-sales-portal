# Branch Merge Plan - Comprehensive Staged Implementation

**Date**: 2025-12-01
**Branches to merge**:
1. `claude/add-battery-only-option-01La8VQjBxYg2ezeh8DKWRR4` (Battery-Only Feature)
2. `claude/heygen-avatar-chat` (HeyGen Avatar Chat)

---

## Pre-Merge Analysis

### Branch 1: Battery-Only Option
**Commits**: 4 ahead of main
**Files changed**: 6 (+501/-89 lines)

| File | Changes |
|------|---------|
| `src/components/wizard/WizardContext.tsx` | Minor state updates |
| `src/components/wizard/steps/Step3System.tsx` | **Major** - Battery-only mode toggle |
| `src/components/wizard/steps/Step4Financing.tsx` | Battery-only financing calculations |
| `src/components/wizard/steps/Step6Summary.tsx` | Display battery-only summary |
| `src/lib/calculations.ts` | **Major** - Tiered tariff battery savings |
| `src/lib/types.ts` | New `GrantType` with `battery_only` option |

**Feature Summary**: Allows customers to purchase battery storage only (without PV panels), with proper savings calculations based on Enemalta tiered tariffs.

---

### Branch 2: HeyGen Avatar Chat
**Commits**: 1 ahead of main
**Files changed**: 14 (all new files)

| File | Purpose |
|------|---------|
| `docs/HAYDEN_DIALOGUE_WORKFLOW.md` | **NEEDS RENAME** → `HEYGEN_DIALOGUE_WORKFLOW.md` |
| `src/app/api/avatar/message/route.ts` | API endpoint for chat messages |
| `src/app/api/avatar/session/route.ts` | API endpoint for session management |
| `src/app/avatar/page.tsx` | Main avatar chat page |
| `src/app/avatar/resume/[token]/page.tsx` | Resume paused sessions |
| `src/lib/avatar/config.ts` | HeyGen + Gemini configuration |
| `src/lib/avatar/conversation-engine.ts` | Dialogue state machine |
| `src/lib/avatar/index.ts` | Module exports |
| `src/lib/avatar/session-manager.ts` | Session persistence |
| `src/lib/avatar/tools.ts` | Function calling implementations |
| `src/lib/avatar/types.ts` | TypeScript interfaces |
| `supabase/migrations/20251201...` | `avatar_sessions` table |
| `package.json` | New dependencies |

**Feature Summary**: Voice-based solar consultation using HeyGen AI avatar with Gemini 2.0 Flash for conversation intelligence.

---

## Misspelling Analysis

### Files with "Hayden" that need review:

| Location | Current | Should Be | Reason |
|----------|---------|-----------|--------|
| Filename: `docs/HAYDEN_DIALOGUE_WORKFLOW.md` | HAYDEN | HEYGEN | File naming convention |
| Comments: "Hayden Avatar Chat" | Hayden | HeyGen | Service/feature name |
| Config: `HAYDEN_AVATAR` | HAYDEN | HEYGEN | Constant naming |
| Avatar persona: "I'm Hayden" | Hayden | **KEEP** | Avatar's character name |
| Avatar ID: `Hayden_20241025` | Hayden | **KEEP** | HeyGen's actual avatar ID |

**Decision**:
- Rename file and code constants from "Hayden" to "HeyGen" (service name)
- **KEEP** "Hayden" as the avatar's character/persona name in dialogues
- The avatar introduces itself as "Hayden" which is fine (character name)

---

## Merge Compatibility Check

| Test | Result |
|------|--------|
| Battery branch → main | Clean merge |
| HeyGen branch → main | Clean merge |
| Both branches together | Clean merge |
| Shared file conflicts | None |

---

## Staged Implementation Plan

### Stage 0: Fix Misspellings in HeyGen Branch
**Before merging**, fix naming in the heygen branch:

```bash
# Checkout the branch
git checkout claude/heygen-avatar-chat

# Rename files
git mv docs/HAYDEN_DIALOGUE_WORKFLOW.md docs/HEYGEN_DIALOGUE_WORKFLOW.md

# Update code constants (keep persona name "Hayden")
# - HAYDEN_AVATAR → HEYGEN_AVATAR
# - "Hayden Avatar Chat" → "HeyGen Avatar Chat" (in comments)

# Commit and push
git commit -m "Rename Hayden → HeyGen (service name, keep avatar persona)"
git push origin claude/heygen-avatar-chat
```

---

### Stage 1: Merge Battery-Only Branch
**Priority**: High (core wizard functionality)

```bash
git checkout main
git pull origin main
git merge origin/claude/add-battery-only-option-01La8VQjBxYg2ezeh8DKWRR4 --no-ff -m "Merge: Add battery-only purchase option"
git push origin main
```

**Validation**:
- [ ] `npm run build` succeeds
- [ ] Test Step 3 wizard with battery-only toggle
- [ ] Verify pricing calculations are correct

---

### Stage 2: Test Battery-Only Locally
```bash
npm run dev
```

Test scenarios:
1. Select "Battery Only" mode in Step 3
2. Verify Step 4 shows battery-only financing
3. Verify Step 6 summary shows correct totals
4. Complete a test lead submission
5. Check Telegram notification format

---

### Stage 3: Merge HeyGen Avatar Branch
**Priority**: Medium (new feature, independent)

```bash
git checkout main
git pull origin main
git merge origin/claude/heygen-avatar-chat --no-ff -m "Merge: Add HeyGen Avatar Chat system"
git push origin main
```

**Validation**:
- [ ] `npm run build` succeeds
- [ ] New `/avatar` route accessible
- [ ] API routes respond (may need env vars)

---

### Stage 4: Apply Supabase Migration
The HeyGen branch includes a migration file for `avatar_sessions` table.

```bash
# Via Supabase CLI (preferred)
supabase db push --project-ref lccebuetwhezxpviyfrs

# Or manually apply SQL:
# File: supabase/migrations/20251201000000_create_avatar_sessions_table.sql
```

**Table schema**:
- `avatar_sessions` - Stores conversation state, collected data, resume tokens

---

### Stage 5: Configure Environment Variables
Add to Railway for HeyGen feature:

```bash
railway variables --set "HEYGEN_API_KEY=<your_key>"
railway variables --set "TWILIO_ACCOUNT_SID=<if_using_sms>"
railway variables --set "TWILIO_AUTH_TOKEN=<if_using_sms>"
railway variables --set "TWILIO_PHONE_NUMBER=<if_using_sms>"
```

**Note**: Feature works without Twilio (SMS links won't send)

---

### Stage 6: Build and Deploy

```bash
npm run build
/opt/homebrew/bin/railway up
```

**Post-deploy verification**:
- [ ] https://get.ghawdex.pro loads correctly
- [ ] Wizard flow works with battery-only option
- [ ] https://get.ghawdex.pro/avatar loads (may show config warning without API key)

---

## Rollback Plan

### If Battery Branch Causes Issues:
```bash
git revert -m 1 <merge_commit_hash>
git push origin main
railway up
```

### If HeyGen Branch Causes Issues:
```bash
git revert -m 1 <merge_commit_hash>
git push origin main
railway up
```

The branches are independent, so reverting one doesn't affect the other.

---

## Post-Merge Cleanup

```bash
# Delete merged branches from remote
git push origin --delete claude/add-battery-only-option-01La8VQjBxYg2ezeh8DKWRR4
git push origin --delete claude/heygen-avatar-chat

# Delete local branches
git branch -d claude/heygen-avatar-chat
```

---

## Success Criteria

- [ ] Both branches merged to main
- [ ] Production build succeeds
- [ ] Battery-only wizard flow works end-to-end
- [ ] HeyGen avatar page loads (feature flag ok if no API key)
- [ ] Existing wizard functionality unchanged
- [ ] Telegram notifications work for both flows
- [ ] No console errors in production

---

## Timeline Estimate

| Stage | Task |
|-------|------|
| 0 | Fix misspellings |
| 1 | Merge battery branch |
| 2 | Local testing |
| 3 | Merge HeyGen branch |
| 4 | Apply migration |
| 5 | Configure env vars |
| 6 | Deploy to Railway |

Total: ~30 minutes if no issues encountered
