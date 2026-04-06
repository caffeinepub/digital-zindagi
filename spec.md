# Digital Zindagi — V40 Final Modules

## Current State
App is a full-featured PWA marketplace with: Admin Dashboard, Manager Dashboard, Delivery Module, Video Gallery (with AdMob), eBook Store, GPS filtering, Google Sheets sync, and social/affiliate controls. All using localStorage for persistence.

## Requested Changes (Diff)

### Add
1. **Multi-Content Feed** — News articles & Sarkari Jobs, each with Title/Image/Link. Unlimited posts from Admin. Professional card layout with 'Read More' / 'Apply Now' buttons. Admin section to add/edit/delete. Manager can also add/edit/delete news/jobs.
2. **Image Resizer Tool** — KB/MB compression + dimension (width/height) control for exam photos. Browser-based, no APIs. Standalone page at `/image-resizer`.
3. **AI Image Enhancer** — Browser-based sharpening/contrast enhancement using Canvas API. No paid APIs. Standalone page at `/ai-enhancer`.
4. **Earning Dashboard** (Admin-only) — Dedicated section in Admin Panel. Shows daily aggregated AdMob + Custom Ads revenue. Filters: 24h, 7d, 30d, 6m, 1y, Lifetime. Bar chart (using recharts/CSS). Data stored as daily summaries in localStorage (`dz_earning_summaries`) for near-zero storage usage.
5. **Master Section Toggles** (Owner-only) — Individual ON/OFF for: News, Sarkari Jobs, Image Resizer, AI Enhancer, YouTube (video filter), Facebook (video filter), Instagram (video filter) in Admin Panel. Hidden sections disappear from app menu.
6. **Ad Frequency Timer** — Admin can set ad interval (e.g. 4h, 12h). Users not shown ads again until interval expires (localStorage timestamp).
7. **Manager Disable Toggle** — Owner can disable/enable Manager Login from Admin Panel with one click.

### Modify
1. **VideoGallery** — Add no-auto-play: show thumbnail + centered Play button. Video loads only on click. Add fullscreen + landscape support. Add quality label (720p/1080p) for YouTube embeds.
2. **AdminDashboardPage** — Add sections: News Manager, Jobs Manager, Section Master Toggles, Earning Dashboard, Manager Login Toggle, Ad Frequency Timer.
3. **ManagerDashboardPage** — Add: News/Jobs add/edit/delete. Remove access to Ads settings and Master Toggles (owner-only).
4. **HomePage** — Read master section toggles; hide News/Jobs/Image tools tabs if toggled OFF.
5. **App.tsx** — Add routes: `/news`, `/jobs`, `/image-resizer`, `/ai-enhancer`.

### Remove
- Nothing removed

## Implementation Plan
1. Write `spec.md` (this file)
2. Create `NewsPage.tsx` — lists news cards from localStorage `dz_news`, read-only for users
3. Create `JobsPage.tsx` — lists job cards from localStorage `dz_jobs`, read-only for users
4. Create `ImageResizerPage.tsx` — canvas-based resize + compress tool
5. Create `AIEnhancerPage.tsx` — canvas-based sharpen/enhance tool
6. Create `EarningDashboard` component — chart + filter, reads `dz_earning_summaries`
7. Update `AdminDashboardPage` — add AdminSection types for news/jobs/earnings/masterToggles, implement CRUD for news/jobs, section ON/OFF toggles, earning dashboard section, manager disable button, ad frequency input
8. Update `ManagerDashboardPage` — add News/Jobs CRUD sections
9. Update `VideoGallery` — no-autoplay with thumbnail overlay
10. Update `HomePage` — read section toggles, conditionally show navigation items
11. Update `App.tsx` — add 4 new routes
