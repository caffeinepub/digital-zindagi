# Digital Zindagi — Smart Rate Memo (V102)

## Current State
The Scrap Calculator page (`/scrap-calculator`) has:
- Rows with Item Name, Weight, Rate, Total columns
- Admin rates loaded from `dz_scrap_rates` localStorage on mount
- Grand Total card at bottom
- Calculate and Reset action buttons
- No persistence of rates between sessions (rates reset to defaults on reload)
- No PDF download or WhatsApp share functionality

## Requested Changes (Diff)

### Add
- **Sticky Rates (localStorage persistence):** When a user changes a rate in any row, save that item's rate to `dz_rate_memo` localStorage key immediately (keyed by item name). On page load, restore saved rates for matching item names.
- **Multi-Item Memory:** Each item name gets its own stored rate. If "Daal", "Chawal", "Lohaa" all have rates saved, all three are remembered independently.
- **PDF Download Button:** At the very bottom of the page, a prominent button to download a PDF of the current memo (item names, weights, rates, totals, grand total). Use browser print/PDF or jsPDF-style approach.
- **WhatsApp Share Button:** Beside the PDF button at the bottom, a WhatsApp share button that generates a formatted text message with all items and grand total, and opens `https://wa.me/?text=...` with URL-encoded content.

### Modify
- **Rate Input:** Always editable (already is). On `onChange` of rate field, immediately persist the new rate to localStorage (keyed by item name). No separate save button.
- **Auto-Calculation:** Already works on state change — no change needed to calculation logic, but ensure total and grand total update instantly as rate is typed (debounce NOT needed — update on every keystroke).
- **Action Buttons Section:** Rename bottom section. Add two new share/export buttons below the existing Calculate/Reset buttons, clearly labeled.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `dz_rate_memo` localStorage read on init — when building initial rows, check `dz_rate_memo[itemName]` and use saved rate if available (overriding admin default only if user has previously set a custom rate).
2. In `updateRow` for `rate` field changes: after updating state, also write to `dz_rate_memo` in localStorage immediately.
3. When a new custom row is added and user types an item name + rate, save that too.
4. Add `handleShareWhatsApp` function: build a formatted string of all rows with weights and rates, append grand total, open `https://wa.me/?text=<encoded>`.
5. Add `handleDownloadPDF` function: use `window.print()` with a print-specific CSS class, OR build a text blob. Simple approach: format a printable string and open in new window with print triggered. Alternatively use inline HTML print.
6. Add two buttons at the bottom of the page below the existing action buttons — "📄 PDF Download" and "💬 WhatsApp Share" — styled prominently, full-width or side-by-side.
