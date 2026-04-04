# Digital Zindagi V147

## Current State
- Admin login uses hardcoded `ADMIN_PASSWORD = "Admin@2024"` and `ADMIN_PIN = "786786"` in LoginPage.tsx
- Header has a Settings gear icon but only shows for logged-in users with certain roles
- Login page logo uses `/assets/generated/dz-logo-transparent.dim_512x512.png` — not `/logo.png`
- Manifest already has correct Digital Zindagi branding, standalone mode, and proper icons
- No `logo.png` exists in public folder (only generated assets)

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
1. **Admin Password Reset:** Change `ADMIN_PASSWORD` to `"123456"` and `ADMIN_PIN` to `"12345"` in LoginPage.tsx
2. **Header Settings Gear:** Settings gear icon must always be visible (for all users including non-logged-in), and must always navigate to `/login` (admin login page)
3. **Login Logo Fix:** Replace broken image with `/assets/generated/dz-logo-transparent.dim_512x512.png` (the working logo path). Also add a fallback to `/logo.png`
4. **Unicode Protection:** Ensure all login page text is clean Hindi — no `\uXXXX` codes visible
5. **PWA Branding:** Manifest already correct. Ensure `logo.png` symlink or alias exists so `/logo.png` resolves correctly in index.html apple-touch-icon references

### Remove
- Nothing to remove

## Implementation Plan
1. LoginPage.tsx: Update ADMIN_PASSWORD = "123456" and ADMIN_PIN = "12345"
2. LoginPage.tsx: Update logo src to use `/assets/generated/dz-logo-transparent.dim_512x512.png` with onError fallback
3. Header.tsx: Settings gear (⚙️) always navigates to `/login` regardless of user role — always visible
4. All login page strings: confirm pure Hindi, no unicode escape codes
