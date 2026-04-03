# Digital Zindagi V118

## Current State
- Provider Registration form (SignupPage.tsx) exists but may have loading/error states blocking submission
- Data is stored in localStorage only — no Firebase/backend DB connection for provider registrations
- Homepage has a visible 'Install App' button (PWA install prompt)
- No social media ON/OFF controls in Admin Panel
- No Affiliate Marketing section in Admin Panel
- Provider form ends with 'Subscription Lege' and 'Ads Dekhe' buttons (V116)
- Admin Panel has sections: founder, categoryManager, users, search, approvals, controls, banners, settings, pricing, staff, ads, chat
- AdminSection type and ALL_NAV_ITEMS array define panel navigation

## Requested Changes (Diff)

### Add
1. **Social Media ON/OFF controls in Admin Panel** — new section or sub-section in Settings/Controls. Admin can toggle social media links (Facebook, Instagram, WhatsApp, YouTube) on/off. When ON, icons appear on homepage. Settings saved to localStorage (`dz_social_settings`).
2. **Affiliate Marketing section in Admin Panel** — new AdminSection `affiliateMarketing`. Admin can toggle ON/OFF. When ON, a visible 'Affiliate Marketing' banner/section appears on homepage with a join/refer link. Settings saved to localStorage (`dz_affiliate_settings`).
3. **Provider registration success message** — After successful form submit, show toast AND inline card: 'Registration Successful! Admin will approve you soon.'
4. **Pending Requests in Admin Panel** — New registrations must appear in Admin Panel > Provider Approvals section as pending entries immediately after submission.

### Modify
1. **Remove Install App button from homepage** — Remove the PWA install button from the hero section of HomePage.tsx entirely.
2. **Provider Registration Form** — Fix any loading/error states. Ensure form submits cleanly. Data (Name, Mobile, Category, plan choice) must be saved to localStorage as `dz_providers` array immediately on submit. Form must always show 'Subscription Lege' and 'Ads Dekhe' choice buttons at the end.
3. **AdminSection type** — Add `affiliateMarketing` to the union type.
4. **ALL_NAV_ITEMS** — Add 'Affiliate Marketing' nav item with appropriate icon.
5. **renderSection switch** — Handle `affiliateMarketing` case.

### Remove
- Install App button and its PWA install logic from HomePage.tsx hero section

## Implementation Plan

1. **HomePage.tsx** — Remove install button block (lines ~99-130) and the `installPrompt` state + `beforeinstallprompt` event listener. Keep rest of hero section intact.

2. **SignupPage.tsx** — Fix provider registration:
   - Remove any hardcoded loading/error states
   - On form submit: save provider data to localStorage `dz_providers` array with fields: id, name, mobile, category, planType (`pending_premium` or `free`), status (`pending`), createdAt (ISO date)
   - Show success toast + navigate to success/choose-plan page
   - Ensure 'Subscription Lege' and 'Ads Dekhe' buttons are present and functional

3. **AdminDashboardPage.tsx**:
   - Add `affiliateMarketing` to AdminSection type
   - Add `AffiliateMrketingSection` component: ON/OFF toggle (saved to `dz_affiliate_settings` in localStorage), plus a text field for the affiliate link/description
   - Add `SocialMediaSection` within Settings or as part of Homepage Controls: per-platform ON/OFF toggles for Facebook, Instagram, WhatsApp, YouTube (saved to `dz_social_settings`)
   - Add nav item for Affiliate Marketing
   - Update ProviderApprovals section to read from localStorage `dz_providers` as well as backend, merging both lists

4. **HomePage.tsx**:
   - Add social media icons section that reads `dz_social_settings` from localStorage — shows enabled social icons with placeholder links
   - Add affiliate marketing banner that reads `dz_affiliate_settings` from localStorage — shows when enabled
