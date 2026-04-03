# Digital Zindagi — V66: Revenue & Icon Fix

## Current State
- CategoryManagerSection: has a simple text input for icon, single price field, per-category Save button
- Backend supports 3 subscription plans: oneMonth, threeMonths, twelveMonths
- CategoryRow: shows name, ON/OFF toggle, price input, AdMob toggle missing, no 2-month/6-month pricing
- HomePage CategoryGrid: hardcoded ALL_CATEGORIES list; only shows toggle-enabled categories from backend; not synced with admin-added categories
- SubscriptionPricingSection: exists as a separate admin section with 3 plan fields
- Provider Bano banner: static text, no dynamic pricing shown
- ProviderSubscribePage: uses 3 plan system (oneMonth, threeMonths, twelveMonths) from backend

## Requested Changes (Diff)

### Add
- Emoji picker panel in "Naya Category Add Karein" section: click on icon field opens a grid of common emojis to pick from
- Per-category subscription pricing: 4 plan price fields per category row (1M, 2M, 6M, 12M)
- AdMob toggle per category row
- "Save All Changes" button at bottom of Category Manager page
- All 12 hardcoded homepage categories also appear in Category Manager as manageable rows (same list, admin can toggle ON/OFF, set prices, set AdMob)
- Home Sync: ProviderSubscribePage reads category-specific pricing from localStorage (set via Category Manager)
- Super Admin identity re-verification: sushhilkumar651@gmail.com always gets adminVerified=true

### Modify
- CategoryRow: add 4 price inputs (1M, 2M, 6M, 12M), add AdMob toggle, expand save logic to include all 4 prices
- CategoryManagerSection: merge hardcoded ALL_CATEGORIES with backend toggles so all 12 default categories appear in the list; use emoji picker instead of text input
- Storage key: save per-category prices as `dz_cat_prices_<categoryName>` with {m1, m2, m6, m12} structure
- handleCategorySave: save all 4 price tiers + admob toggle to localStorage
- ProviderSubscribePage: read pricing from localStorage per-category (fallback to backend global pricing)
- HomePage Provider Bano banner: show lowest active price from localStorage

### Remove
- Nothing removed

## Implementation Plan
1. Add EMOJI_LIST constant and EmojiPicker inline component in AdminDashboardPage
2. Update CategoryManagerSection to merge ALL_CATEGORIES (from CategoryGrid) with backend toggles so all 12 default categories are always shown
3. Update CategoryRow interface and component: add price4 fields (m1Price, m2Price, m6Price, m12Price), adMobOn toggle, rename onSave signature
4. Add global "Save All Changes" button at bottom that iterates all categories and saves them at once
5. Update storage logic: dz_cat_prices_{name} = {m1, m2, m6, m12, adMob, isOn}
6. Update ProviderSubscribePage to read category-specific pricing if category param is available, else fall back to global pricing
7. Re-verify Super Admin identity in AdminPinPage and AuthContext
