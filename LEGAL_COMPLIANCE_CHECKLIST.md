# LEGAL COMPLIANCE CHECKLIST

**Status:** ⚠️ **NOT PRODUCTION READY** - Placeholder values must be replaced
**Last Updated:** 2026-05-30

This document lists all placeholder values in legal pages that MUST be replaced with real production values before going live.

---

## ⚠️ CRITICAL: Placeholder Emails and Contact Information

The following placeholder contact details appear in legal pages and MUST be replaced with real, monitored production values:

### Required Email Addresses

You MUST set up and monitor the following email addresses:

#### 1. Privacy/Data Protection Email
**Where it appears:**
- PrivacyPolicyPage.tsx (lines 24, 161)
- PopiaContactPage.tsx (lines 38, 82, 162)

**Current placeholder:** `privacy@prodview.example.com`
**Must replace with:** Your real privacy/data protection email (e.g., `privacy@prodview.co.za` or `dpo@prodview.co.za`)

**Requirements:**
- ✅ Must be a working email address that is actively monitored
- ✅ MUST respond to GDPR/POPIA data requests within 30 days (legal requirement)
- ✅ MUST be monitored daily (data subject requests are legally binding)
- ✅ Consider using a shared mailbox or ticketing system (e.g., privacy@yourdomain.com → support ticket)

#### 2. General Support Email
**Where it appears:**
- PopiaContactPage.tsx (line 214)

**Current placeholder:** `support@prodview.example.com`
**Must replace with:** Your real support email (e.g., `support@prodview.co.za` or `info@prodview.co.za`)

**Requirements:**
- ✅ Must be a working email address
- ✅ Should be monitored regularly for general inquiries

---

### Required POPIA Information Officer Details

**Where it appears:**
- PopiaContactPage.tsx (lines 26-61)

**What needs to be filled in:**

#### Information Officer Name
**Current:** `[Name - PLACEHOLDER]` (line 31)
**Must replace with:** Full legal name of the designated Information Officer

**Requirements:**
- ✅ MUST be a real person (legal requirement under POPIA Section 56)
- ✅ Can be the business owner, director, or designated employee
- ✅ MUST have authority to handle data requests

#### Phone Number
**Current:** `[Phone Number - PLACEHOLDER]` (line 47)
**Must replace with:** Working South African phone number (e.g., `+27 11 123 4567`)

**Requirements:**
- ✅ Must be a working phone number
- ✅ Should be monitored during business hours
- ✅ Can be a main office line or dedicated privacy line

#### Physical Address
**Current:** (lines 54-58)
```
[Physical Address - PLACEHOLDER]
[City, Postal Code]
South Africa
```

**Must replace with:** Your real South African business address

**Example:**
```
123 Main Street, Suite 4
Cape Town, 8001
South Africa
```

**Requirements:**
- ✅ MUST be a physical South African address (PO Box not accepted for POPIA Information Officer)
- ✅ Must be where official correspondence can be received
- ✅ Must be kept up-to-date if address changes

---

## 📝 How to Replace Placeholder Values

### Step 1: Prepare Your Production Contact Information

Before editing files, prepare the following information:

- [ ] Privacy email address (set up and test it works)
- [ ] Support email address (set up and test it works)
- [ ] Information Officer name (legal name of designated person)
- [ ] Information Officer phone number (working South African number)
- [ ] Information Officer physical address (complete South African address)

### Step 2: Replace Placeholders in Privacy Policy

**File:** `src/pages/legal/PrivacyPolicyPage.tsx`

**Line 24:** Replace `privacy@prodview.example.com` with your real privacy email

**Line 161:** Replace `privacy@prodview.example.com` with your real privacy email

### Step 3: Replace Placeholders in POPIA Contact Page

**File:** `src/pages/legal/PopiaContactPage.tsx`

**Line 31:** Replace `[Name - PLACEHOLDER]` with Information Officer's full name

**Lines 38, 82, 162:** Replace `privacy@prodview.example.com` with your real privacy email

**Line 47:** Replace `[Phone Number - PLACEHOLDER]` with real phone number (format: +27 XX XXX XXXX)

**Lines 54-58:** Replace address placeholder with:
```
[Your Street Address, Unit/Suite]
[City, Postal Code]
South Africa
```

**Line 214:** Replace `support@prodview.example.com` with your real support email

### Step 4: Verify All Changes

Run this command to check for any remaining placeholders:

```bash
# Search for "example.com" (should return 0 results in src/pages/legal/)
grep -r "example.com" src/pages/legal/

# Search for "PLACEHOLDER" (should return 0 results)
grep -r "PLACEHOLDER" src/pages/legal/
```

If either command returns results, you have missed some placeholders!

### Step 5: Test Email Deliverability

Before going live:

1. Send test emails to all configured addresses
2. Verify emails are received and can be replied to
3. Set up email filters/rules for POPIA/GDPR requests (recommended)
4. Configure auto-reply acknowledging receipt (recommended)

---

## 🔐 POPIA/GDPR Compliance Requirements

### Mandatory Before Production

- [ ] **Email Setup:** All email addresses working and monitored
- [ ] **Information Officer Designated:** Legal person appointed with authority
- [ ] **Phone Number Working:** Can receive calls during business hours
- [ ] **Physical Address Verified:** Can receive official mail/legal notices
- [ ] **Data Request Procedures:** Team knows how to handle GDPR/POPIA requests
- [ ] **30-Day Response SLA:** Process in place to respond within legal timeframe
- [ ] **Data Deletion Endpoint:** Technical implementation complete (see below)
- [ ] **Analytics Retention:** 24-month auto-deletion configured (see below)

### Recommended Before Production

- [ ] **Privacy Ticketing System:** Track data subject requests systematically
- [ ] **Legal Review:** Have Privacy Policy reviewed by qualified legal professional
- [ ] **POPIA Registration:** Register with Information Regulator if required
- [ ] **Data Processing Agreements:** With hosting provider, CDN, analytics services
- [ ] **Staff Training:** Team understands GDPR/POPIA obligations
- [ ] **Incident Response Plan:** Know what to do if data breach occurs

---

## 🛠️ Technical Compliance Implementation

The following technical fixes have been implemented to support legal compliance:

### ✅ Implemented (Session 6)

1. **Analytics Data Retention Enforcement**
   - Auto-deletes analytics events older than 24 months
   - Scheduled cleanup job runs weekly
   - See: `backend/src/analytics/analytics-cleanup.service.ts`

2. **Data Deletion API Endpoint**
   - `/api/analytics/delete-my-data` endpoint for GDPR/POPIA compliance
   - Allows users to delete all their analytics data by session ID
   - See: `backend/src/analytics/analytics.controller.ts`

3. **Consent Version Notification**
   - Users are re-prompted when consent policy version changes
   - See: `src/contexts/ConsentContext.tsx`

### Cookie Consent Verification

The cookie consent banner is already implemented and functional:

✅ **ConsentContext** - Manages user consent preferences
✅ **CookieBanner** - Shows on first visit before tracking
✅ **Accept/Decline** - Users can accept or reject non-essential cookies
✅ **Persistent Storage** - Choice is saved to localStorage
✅ **Analytics Gating** - Analytics only track if consent given

**Location:** `src/contexts/ConsentContext.tsx`, `src/components/CookieBanner.tsx`

---

## ⚠️ Legal Disclaimer

**IMPORTANT:** This checklist provides technical implementation guidance only.

**You MUST:**
- Have all legal pages reviewed by a qualified legal professional
- Consult a privacy lawyer familiar with POPIA (South Africa) and GDPR (EU)
- Ensure all policies accurately reflect your actual data practices
- Keep policies updated as your site/services change
- Comply with all applicable laws and regulations

**This checklist does not constitute legal advice.**

---

## 📅 Regular Maintenance Schedule

### Quarterly Review (Every 3 Months)

- [ ] Review and update "Last Updated" dates if policies changed
- [ ] Verify all contact information still accurate
- [ ] Check email addresses are still monitored
- [ ] Review data retention periods still appropriate
- [ ] Audit third-party services and update disclosures

### Annual Review (Once Per Year)

- [ ] Full legal review by qualified professional
- [ ] POPIA registration renewal (if applicable)
- [ ] Update consent version and re-prompt users if significant changes
- [ ] Review and refresh Data Processing Agreements
- [ ] Privacy impact assessment for new features

---

## 🎯 Production Go-Live Checklist

Before deploying to production, verify:

- [ ] All placeholder emails replaced and tested
- [ ] All POPIA contact details complete and accurate
- [ ] Information Officer designated and aware of responsibilities
- [ ] Privacy email monitored daily
- [ ] 30-day response procedure documented
- [ ] Data deletion endpoint tested and working
- [ ] Analytics retention enforcement active
- [ ] Cookie consent banner appears on first visit
- [ ] Legal pages linked from footer
- [ ] No placeholder text remaining anywhere
- [ ] Legal professional has reviewed policies

**Status Check Command:**
```bash
# Run this to check for any remaining placeholders
grep -r "PLACEHOLDER\|example\.com" src/pages/legal/ || echo "✅ No placeholders found"
```

---

**Document Version:** 1.0
**Last Updated:** 2026-05-30
**Next Review:** 2026-08-30 (3 months)
