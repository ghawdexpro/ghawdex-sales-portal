# Domain Setup Checklist for get.ghawdex.pro

## DNS Configuration (Namecheap)

Add this CNAME record:
```
Type     Host    Value
CNAME    get     [railway-url].up.railway.app
```

---

## Services to Configure

### 1. Google Analytics (GA4)
**Dashboard:** https://analytics.google.com/
**Property:** G-2SZNR72JNF

**Steps:**
1. Go to Admin → Data Streams
2. Click on existing stream or create new
3. Add `get.ghawdex.pro` to allowed domains
4. Verify data collection is working

---

### 2. Facebook Pixel
**Dashboard:** https://business.facebook.com/events_manager
**Pixel ID:** 809814008544994

**Steps:**
1. Go to Events Manager
2. Click on the pixel
3. Settings → Allowed domains
4. Add `get.ghawdex.pro`
5. Test events using Events Manager test tool

---

### 3. Zoho SalesIQ
**Dashboard:** https://salesiq.zoho.eu/
**Widget Code:** siq1e2a84a6f5694dc14926833d8dde08a598a33faa6538edd0ac7a6f6e4051b74d

**Steps:**
1. Go to Settings → Brands
2. Select your brand (Ghawdex)
3. Go to "Allowed Domains"
4. Add: `get.ghawdex.pro`, `www.get.ghawdex.pro`
5. Save changes
6. Test chat widget appears

---

### 4. Google Cloud Console (APIs)
**Dashboard:** https://console.cloud.google.com/
**Project:** primal-turbine-478412-k9

**For Google Maps/Solar API:**
1. Go to APIs & Services → Credentials
2. Find your API key
3. Click Edit
4. Under "Website restrictions" add:
   - `https://get.ghawdex.pro/*`
   - `https://*.get.ghawdex.pro/*`
5. Save

---

### 5. Zoho CRM (if using API)
**Dashboard:** https://crm.zoho.eu/
**API Console:** https://api-console.zoho.eu/

**Steps:**
1. Go to API Console
2. Find your Self Client
3. Add `https://get.ghawdex.pro` to redirect URIs (if needed)

---

### 6. Railway
**Dashboard:** https://railway.app/

**Steps:**
1. Deploy project: `railway up`
2. Add custom domain: `railway domain`
3. Enter: `get.ghawdex.pro`
4. Copy the Railway URL for DNS CNAME
5. Set environment variables (all from .env.local)

---

### 7. Supabase (CORS/Auth)
**Dashboard:** https://app.supabase.com/
**Project:** kuoklfrqztafxtoghola

**Steps:**
1. Go to Project Settings → API
2. Under "API Settings" find "Additional Redirect URLs"
3. Add: `https://get.ghawdex.pro/**`
4. Save

---

## Environment Variables for Railway

Copy all from `.env.local` to Railway:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://kuoklfrqztafxtoghola.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBrFY-fUgljav3Mtc_scNjNh8Vq63MJRXU
GOOGLE_SOLAR_API_KEY=AIzaSyBrFY-fUgljav3Mtc_scNjNh8Vq63MJRXU
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_GA4_ID=G-2SZNR72JNF
NEXT_PUBLIC_FB_PIXEL_ID=809814008544994
NEXT_PUBLIC_ZOHO_SALESIQ_CODE=siq1e2a84a6f5694dc14926833d8dde08a598a33faa6538edd0ac7a6f6e4051b74d

# Update for production
NEXT_PUBLIC_APP_URL=https://get.ghawdex.pro
```

---

## Verification Checklist

After deployment, verify:

- [ ] Site loads at https://get.ghawdex.pro
- [ ] SSL certificate is active (HTTPS)
- [ ] Google Analytics receiving events (Real-time report)
- [ ] Facebook Pixel firing (use FB Pixel Helper extension)
- [ ] Zoho SalesIQ chat widget appears
- [ ] WhatsApp button works
- [ ] Supabase connection works

---

## Testing Tools

- **GA4 Debug:** Chrome extension "Google Analytics Debugger"
- **FB Pixel:** Chrome extension "Facebook Pixel Helper"
- **Zoho SalesIQ:** Check dashboard for visitor activity
- **SSL:** https://www.ssllabs.com/ssltest/

---

*Last updated: November 2024*
