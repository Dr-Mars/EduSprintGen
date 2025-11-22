# Design Guidelines - PFE Management Platform

## Design Approach
**Reference-Based (Educational Systems):** Drawing from Moodle and Google Classroom's proven educational UX patterns, prioritizing clarity, accessibility, and efficient task completion for academic workflows.

## Color System
```
Primary: hsl(342, 85%, 53%) - Vibrant red for CTAs, active states, important alerts
Secondary: hsl(0, 0%, 77%) - Light gray for borders, dividers, inactive elements
Background: hsl(0, 0%, 94%) - Very light gray for page background
Surface: hsl(0, 0%, 100%) - White for cards, modals, elevated surfaces
Text Primary: hsl(0, 0%, 10%) - Near-black for headings and body text
Text Secondary: hsl(0, 0%, 45%) - Medium gray for labels, captions

Status Colors:
- Success (Validated): hsl(142, 70%, 45%)
- Warning (Pending): hsl(45, 95%, 50%)
- Error (Rejected): hsl(0, 85%, 55%)
- Info (Draft): hsl(210, 80%, 55%)
```

## Typography - Poppins Family
```
Headings:
- H1: 32px / font-semibold (Dashboard titles)
- H2: 24px / font-semibold (Section headers)
- H3: 20px / font-medium (Card titles)
- H4: 16px / font-medium (Subsections)

Body:
- Large: 16px / font-normal (Primary content)
- Regular: 14px / font-normal (Standard text)
- Small: 12px / font-normal (Captions, metadata)

UI Elements:
- Buttons: 14px / font-medium
- Labels: 13px / font-medium / uppercase / letter-spacing-wide
- Links: 14px / font-normal / underline on hover
```

## Layout System
**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16 (matching 16px base specification)
- Component padding: p-4 or p-6
- Section spacing: py-8 or py-12
- Card gaps: gap-4 or gap-6
- Form field spacing: space-y-4

**Container Structure:**
- Max width: max-w-7xl for main content
- Sidebar width: 280px (fixed navigation)
- Page padding: px-6 md:px-8

## Component Library

### Cards (Educational Content Cards)
- Background: White surface
- Border radius: 0.8rem (as specified)
- Border: 1px solid secondary gray
- Shadow: subtle on hover (shadow-sm to shadow-md transition)
- Padding: p-6
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

### Buttons
- Primary (Red): Full primary color, white text, font-medium
- Secondary: White bg, primary color border + text
- Ghost: Transparent, hover gray background
- Height: h-10 (40px)
- Padding: px-6
- Border radius: 0.8rem

### Forms
- Input fields: White bg, secondary border, 0.8rem radius, h-10
- Labels: Above inputs, font-medium, text-sm
- Focus state: Primary color ring
- Error state: Red border + error text below
- Multi-step indicator: Horizontal stepper with primary color for active/completed steps

### Navigation
- Left sidebar: Fixed, white surface, primary accent for active items
- Top bar: White, height 64px, includes user profile dropdown
- Breadcrumbs: Small text with "/" separators

### Tables
- Header: Light gray background, font-medium
- Rows: Alternating white/very light gray, hover state
- Actions column: Icon buttons aligned right
- Pagination: Bottom right, showing "X-Y of Z results"

### Status Badges
- Small rounded pills (rounded-full)
- Padding: px-3 py-1
- Font size: 12px, font-medium
- Color-coded by status (success/warning/error/info)

### Modals & Overlays
- Backdrop: Semi-transparent black (bg-black/50)
- Modal: White, max-w-2xl, 0.8rem radius, p-8
- Header with title + close button
- Footer with action buttons (right-aligned)

### Dashboard Widgets
- Stat cards: White surface, icon + number + label
- Charts: Clean, minimal using primary color
- Activity feed: Timeline with dots and connecting lines
- Calendar view: Monthly grid with event indicators

## Images
**Hero Section:** No traditional hero image needed - this is a utility application. Dashboard opens directly to functional workspace.

**Supporting Images:**
- User profile photos: Circular, 40px diameter in navigation, larger in profile pages
- Document thumbnails: PDF preview icons in upload lists
- Empty states: Friendly illustrations for "no data yet" scenarios
- University branding: Logo in top-left navigation (max 180px width)

## Interaction Patterns
- **Loading states:** Skeleton screens matching card layouts
- **Animations:** Minimal - smooth transitions (150ms) for hovers, dropdowns
- **Notifications:** Toast-style in top-right, auto-dismiss after 5s
- **File upload:** Drag-and-drop zones with dashed borders, progress bars
- **Validation:** Inline real-time for forms, summary at top on submit

## Responsive Behavior
- Desktop (1280px+): Full sidebar + 3-column card grids
- Tablet (768px-1279px): Collapsible sidebar + 2-column grids
- Mobile (<768px): Bottom navigation + single column stacked layout