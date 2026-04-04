# Digital Zindagi V141

## Current State
App has raw Unicode escapes visible in JSX. Header lacks a visible admin/settings icon. Logo path /logo.png may be missing.

## Requested Changes (Diff)

### Add
- Admin gear icon in header linking to /admin/pin

### Modify
- HomePage.tsx: replace all Hindi/emoji Unicode escapes with literal UTF-8
- Header.tsx: add admin/settings icon visible always
- SplashScreen.tsx: use /logo.png with fallback
- Other files: replace \u escapes with literal chars

### Remove
- All raw Unicode escape sequences in JSX string literals

## Implementation Plan
1. Fix HomePage.tsx Unicode escapes to literal Hindi+emoji
2. Add admin Settings icon to Header.tsx
3. Fix logo path in SplashScreen and HomePage
4. Fix other files with Unicode escapes
