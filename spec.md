# Digital Zindagi — V124: Multi-eBook Management System

## Current State
- Full multi-vendor marketplace PWA with Emerald Green theme
- Admin Panel has: Category Manager, User Management, Provider Approvals, Ads Manager, Social Media, Affiliate Marketing, Founder Settings, Security Settings
- HomePage shows: Hero Carousel, Rate Calculator, Category Grid, Featured Providers, Register CTA, Affiliate Banner, Social Media icons
- All data is stored in localStorage (prefixed `dz_`)
- Provider payment screenshot approvals exist in ProviderApprovals section

## Requested Changes (Diff)

### Add
1. **Admin Panel — eBook Manager section** (`ebookManager`):
   - 'Add New eBook' button opens an inline form with: Book Title, Cover Image URL, Price, Download Link (PDF URL), Description
   - Save button stores the eBook in `dz_ebooks` localStorage array with unique id, title, coverUrl, price, downloadLink, description, createdAt
   - Each eBook card in admin shows: cover thumbnail, title, price, Edit (pencil) and Delete (trash) buttons
   - Edit mode: inline editable fields for all 5 fields, Save/Cancel
   - **eBook Store ON/OFF toggle** at the top of eBook Manager — when OFF, the entire eBook section is hidden from homepage; when ON it shows
   - Store toggle saved to `dz_ebook_store_enabled` (boolean) in localStorage

2. **Admin Panel — Provider Payment Notification Enhancement**:
   - When a provider submits a payment screenshot, the book name should appear in the Pending Approvals notification
   - In `ProviderApprovals` section, local providers from `dz_providers` should show `bookName` field if present

3. **HomePage — eBook Store Section** (dynamic, below Category Grid, above Featured Providers):
   - Only visible when `dz_ebook_store_enabled` is `true`
   - Reads eBooks from `dz_ebooks` localStorage
   - Shows a scrollable horizontal grid of eBook cards (BookCover image, Title, Price, 'Buy Now' button)
   - Clicking 'Buy Now' opens a purchase modal:
     - Shows book title, cover, price
     - Input for buyer name and mobile
     - UPI QR/screenshot upload (file picker)
     - 'Send Payment Screenshot' button → saves to `dz_ebook_purchases` with bookId, bookTitle, buyerName, buyerMobile, screenshotBase64, status: 'pending', submittedAt
   - A book is locked (padlock icon, no download) until its purchase entry has `status: 'approved'` for that buyer's mobile number
   - If approved, 'Download PDF' button appears (links to `downloadLink`)

4. **Admin Panel — eBook Purchases Notifications**:
   - In ProviderApprovals (or new sub-section inside eBook Manager), show pending eBook purchase requests
   - Each notification shows: Buyer Name, Mobile, **Book Name**, screenshot preview, Approve / Reject buttons
   - Approving sets `status: 'approved'` in `dz_ebook_purchases` for that entry
   - Rejecting removes the entry

### Modify
- `AdminDashboardPage.tsx`: Add `ebookManager` to `AdminSection` type; add sidebar nav item "📚 eBook Store"; add `EbookManagerSection` component; modify `ProviderApprovals` to also show eBook purchase pending requests with book name visible
- `HomePage.tsx`: Add eBook store section between CategoryGrid and Featured Providers; read toggle state + books from localStorage

### Remove
- Nothing removed

## Implementation Plan
1. Add `EbookManagerSection` component inside `AdminDashboardPage.tsx`:
   - State: `dz_ebooks` (array of books), `dz_ebook_store_enabled` (bool)
   - Toggle card at top (ON/OFF store)
   - 'Add New eBook' button → show inline add form
   - Book list with Edit/Delete per row
2. Enhance `ProviderApprovals` component to also render `dz_ebook_purchases` (pending) with book name + Approve/Reject
3. Add eBook Store section in `HomePage.tsx`:
   - Read `dz_ebook_store_enabled` and `dz_ebooks`
   - Horizontal scroll grid of book cards
   - Buy Now modal with name, mobile, screenshot upload, submit
   - Per-book lock logic based on buyer mobile matching an approved entry in `dz_ebook_purchases`
4. Validate and build
