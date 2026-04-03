# Digital Zindagi

## Current State

- AdminDashboardPage has a `UserManagement` component with 3 tabs: "Naye Users (48h)", "All Customers", "All Providers"
- The UserManagement table shows: Naam, Mobile (hidden sm), Role (hidden md) — no Registration Date
- There is a separate `GlobalSearch` section in the admin sidebar that shows a standalone search input with its own section
- No quick-action modal on provider name click in search results
- `ScrapCalculatorPage` exists at `/scrap-calculator` with full calculator functionality
- `HomePage` has a `CategoryGrid` section labeled "Popular Services" — Scrap category is among them
- No dedicated "Rate Calculator" button on the homepage

## Requested Changes (Diff)

### Add
- **Search Bar inside UserManagement**: A search icon + text input at the very top of the "User Management" screen (inline, not a separate section). Typing a name or mobile number filters the currently visible list in real-time (client-side filter on the displayed users array)
- **Two new tabs in UserManagement**: 
  - `"Naye Providers"` — providers who registered within the last 7 days (filter by `registrationDate`)
  - `"Purane Providers"` — providers registered more than 30 days ago
- **Registration Date column** in the user table — visible alongside Name and Mobile
- **Quick Action modal** in search results: clicking a provider's name opens an inline modal/panel showing their payment photo (`paymentScreenshotBlobId`) and Approve/Reject buttons
- **Rate Calculator button on HomePage**: A large, prominent button labeled "🧮 Rate Calculator" placed above or next to the Service Categories grid — visually distinct, above CategoryGrid, with a Calculator icon so it's visually clear
- **Admin Rates Link**: ScrapCalculatorPage should load rates from localStorage (`dz_cat_row_Scrap` or similar key) and use admin-set rates for Lohaa, Kaagaz, Taamba if available

### Modify
- `UserManagement` component: add search bar at top, extend tab type to include `"nayeProviders" | "puraneProviders"`, extend table to show `registrationDate`
- `GlobalSearch` component: add clickable provider name that opens a quick-action modal with payment photo and Approve/Reject buttons (using `useApproveProvider` / `useRejectProvider` hooks already imported)
- `ScrapCalculatorPage`: On mount, read rates from localStorage keys `dz_scrap_lohaa_rate`, `dz_scrap_kaagaz_rate`, `dz_scrap_taamba_rate` (or fall back to admin category row data) — pre-fill rate fields
- `HomePage`: Add a "Rate Calculator" CTA card/button section above `<CategoryGrid>` — large, emerald-styled, with Calculator icon, navigates to `/scrap-calculator`

### Remove
- Nothing removed

## Implementation Plan

1. **AdminDashboardPage.tsx — UserManagement function**:
   - Add `searchQuery` state (string)
   - Add search bar input at top with Search icon
   - Add `"nayeProviders"` and `"puraneProviders"` to tab type union
   - For `nayeProviders`: filter providers where `createdAt` (timestamp bigint, milliseconds) is within last 7 days
   - For `puraneProviders`: filter providers where `createdAt` > 30 days ago
   - Apply `searchQuery` filter on top of active tab data (filter by name or mobile containing query)
   - Add `registrationDate` column to table header and rows — format as DD/MM/YYYY from user's `createdAt` field
   - For provider rows: make name clickable — opens inline `ProviderQuickAction` modal showing payment screenshot + Approve/Reject

2. **AdminDashboardPage.tsx — GlobalSearch function**:
   - Make provider names in search results clickable
   - Show a `ProviderQuickAction` inline modal/sheet with payment photo and Approve/Reject buttons

3. **Add `ProviderQuickAction` component** (inline in AdminDashboardPage):
   - Props: `userId: bigint`, `shopName: string`, `paymentScreenshotBlobId?: string`, `onClose: () => void`
   - Shows payment photo if available, otherwise placeholder
   - Approve button (uses `useApproveProvider`)
   - Reject button (uses `useRejectProvider`)

4. **ScrapCalculatorPage.tsx**:
   - On mount, read rates from localStorage: check `dz_scrap_rates` or `dz_cat_row_Scrap` for rate data
   - Also support individual keys that admin may have set
   - Pre-fill the 3 default rows with admin rates if available

5. **HomePage.tsx**:
   - Import `Calculator` icon from lucide-react
   - Add a prominent "Rate Calculator" section/card just above the `<CategoryGrid>` section
   - Card should use emerald styling, be large and eye-catching, with calculator icon + text
   - Use `useNavigate` to route to `/scrap-calculator` on click
