# SONSIEL Mentorship Hub - Design Guidelines

## Design Approach

**Selected System:** Material Design 3 with healthcare professional adaptations  
**Rationale:** This mentorship platform prioritizes clarity, accessibility, and trust for healthcare professionals. Material Design provides robust component patterns for data-heavy interfaces while maintaining professional credibility.

**Core Principles:**
- Clarity over creativity: Information hierarchy drives every decision
- Trust through professionalism: Clean, consistent, credible aesthetic
- Accessibility-first: Healthcare professionals work in varied environments
- International readiness: Design accommodates Portuguese/Spanish content expansion

---

## Typography System

**Font Stack:** Inter (primary), Roboto (fallback) via Google Fonts CDN

**Hierarchy:**
- **Display/Hero:** 3xl to 4xl, font-semibold (landing hero, major section headers)
- **H1 (Page Titles):** 2xl, font-semibold (dashboard headers, auth pages)
- **H2 (Section Headers):** xl, font-semibold (card headers, subsections)
- **H3 (Component Titles):** lg, font-medium (list items, table headers)
- **Body:** base, font-normal (paragraphs, descriptions, form labels)
- **Small/Meta:** sm, font-normal (timestamps, helper text, captions)
- **Micro:** xs, font-medium (badges, tags, status indicators)

**Line Heights:** Use relaxed (1.625) for body text, tight (1.25) for headings to maximize readability in healthcare documentation context.

---

## Layout & Spacing System

**Tailwind Units:** Standardize on 2, 4, 6, 8, 12, 16 for consistency  

**Application:**
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16 (desktop), py-8 (mobile)
- Element gaps: gap-4, gap-6, gap-8
- Form field spacing: space-y-4, space-y-6

**Container Strategy:**
- Auth pages: max-w-md (centered forms)
- Dashboard content: max-w-7xl (data tables, grids)
- Profile sections: max-w-4xl (comfortable reading)

**Grid Patterns:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Mentor/mentee listings: grid-cols-1 lg:grid-cols-2 (richer cards)
- Analytics: grid-cols-2 md:grid-cols-4 (stat blocks)

---

## Component Library

### Authentication Pages
**Layout:** Split-screen on desktop (lg:grid-cols-2), single column mobile  
- Left: Branding + value proposition with supporting imagery
- Right: Form (max-w-md, p-8)
- Forms include: clear labels, inline validation, prominent CTAs, "Back to login" links

### Dashboard Layout
**Structure:** Fixed sidebar (w-64) + main content area  
- Sidebar: Logo, navigation items with icons (Heroicons), user profile dropdown at bottom
- Topbar: Breadcrumbs, search, notifications, user avatar
- Content: Generous whitespace, card-based organization

### Navigation
- Primary nav: Vertical sidebar with icon + label
- Mobile: Bottom sheet drawer with overlay
- Active states: Subtle background treatment, font-semibold
- Icon library: Heroicons (via CDN)

### Data Tables
- Striped rows for readability
- Sortable headers with indicators
- Action columns (right-aligned)
- Pagination below, showing "1-10 of 247" context
- Responsive: Stack to cards on mobile

### Cards
- Standard padding: p-6
- Header with title + action button/menu
- Dividers between sections (border-t)
- Footer for metadata/actions when needed

### Forms
- Full-width inputs on mobile, max-w-md on desktop
- Label above input, helper text below
- Required field indicators (*)
- Clear error states with icon + message
- Progressive disclosure for complex forms

### Messaging Interface
- Three-column on desktop: conversation list | chat thread | user info panel
- Two-column on tablet: conversation list | chat thread
- Single view on mobile with back navigation
- Message bubbles: rounded corners, sender-aligned

### Modals & Overlays
- Centered dialogs with max-w-lg to max-w-2xl
- Backdrop blur with semi-transparent overlay
- Close button (top-right) + Cancel/Confirm actions (bottom)

---

## Images

**Hero Image (Public Landing):** Full-width, 70vh on desktop, showing diverse healthcare professionals in mentorship context (mentor/mentee interaction, collaborative setting). Image should convey professionalism, diversity, and connection. Place text overlay with blurred button backgrounds (backdrop-blur-sm).

**Dashboard Illustrations:** Use subtle spot illustrations for empty states (no mentees assigned, no messages, etc.). Style: Line art with minimal visual weight.

**Profile Avatars:** Circular, 40x40 (lists), 80x80 (profile headers), 120x120 (profile pages). Include placeholder initials with distinct backgrounds for users without photos.

**Auth Page Imagery:** Professional healthcare mentorship scenes on left panel of split-screen layout. Images should feel aspirational yet authentic.

---

## Responsive Behavior

**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

**Key Adaptations:**
- Sidebar: Permanent (lg+), drawer (below lg)
- Cards: Single column (mobile), 2-col (md), 3-col (lg+)
- Forms: Full-width (mobile), centered max-w-md (md+)
- Tables: Card transformation on mobile with stacked key data
- Split-screen auth: Single column (below lg), side-by-side (lg+)

---

## Animations

**Minimal, Purposeful Only:**
- Page transitions: Subtle fade (150ms)
- Dropdown/modal entry: Scale + opacity (200ms)
- Hover states: No animation, instant visual feedback
- Loading states: Skeleton screens (no spinners unless necessary)

---

## Accessibility Standards

- WCAG 2.1 AA compliance minimum
- Keyboard navigation for all interactive elements
- Focus indicators visible and distinct
- ARIA labels for icon-only buttons
- Form inputs with associated labels (not placeholder-only)
- Sufficient touch targets (min 44x44px)
- Screen reader tested for critical flows