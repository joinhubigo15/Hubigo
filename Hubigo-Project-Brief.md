# Hubigo — Project Context Brief

## What it is
Hubigo is a startup building a modern local business discovery platform for India — similar to Justdial, Google Business Profile, and Yelp. Users search for nearby businesses (restaurants, hospitals, hotels, gyms, salons, plumbers, electricians, shopping, etc.), view verified profiles, contact via call/WhatsApp, get directions, and leave reviews. Business owners claim/create listings, subscribe to a paid tier, receive leads, and track analytics. Three user types: Normal User, Business Owner, Admin.

Vision: become India's most trusted local discovery platform — Justdial's local depth with Airbnb/Stripe-level product design.

# HUBIGO Design System

## Source of Truth

The current implemented Home page is the official HUBIGO design system.

Whenever creating, modifying, or extending the application, ALWAYS refer to the existing Home page and approved UI screens before making any design decisions.

Do not introduce a new design language.

---

## Design Consistency

Every future page, component, modal, dialog, dashboard, form, or feature must feel like it belongs to the same application.

Always preserve the existing:

- Color palette
- Layout structure
- Visual hierarchy
- Typography
- Component proportions
- Navigation style
- Card design
- Search bars
- Buttons
- Input fields
- Chips
- Badges
- Shadows
- Border radius
- Icons
- Illustration style
- White space
- Spacing system
- Animations
- Responsive behavior

If a design decision is unclear, copy the style and behavior from the existing Home page rather than inventing something new.

---

## Responsive Design

Always design Mobile First.

After the mobile layout is complete, adapt it naturally for:

- Tablet
- Laptop
- Desktop
- Large Desktop

Do not simply scale or stretch the mobile design.

Desktop layouts should intelligently use additional space through grids, sidebars, multiple columns, and improved spacing while preserving the same visual identity.

---

## Component Reuse

Always reuse existing components whenever possible.

Never create duplicate button styles, card styles, navigation patterns, forms, or search components unless explicitly instructed.

The goal is to build a single unified design system.

---

## Future Pages

Every new page must appear as though it was designed by the same senior product designer who created the Home page.

A user should be able to navigate between pages without noticing any visual inconsistency.

When new UI is required, extend the existing design system rather than creating a new one.

---

## Rule

When there is any conflict between written instructions and the existing approved Home page design, ALWAYS prioritize the existing Home page and approved design references.

The Home page is the permanent visual source of truth for the entire HUBIGO application.

# Non-Negotiable Rules

These rules override all future prompts unless explicitly changed.

- Never redesign the established HUBIGO design system.
- Never replace the existing technology stack.
- Never introduce a new architecture without approval.
- Never rename existing APIs, folders or components unless requested.
- Never duplicate components that already exist.
- Always extend existing code before creating new implementations.
- Prefer reuse over recreation.
- Always maintain backward compatibility unless instructed otherwise.

# Coding Standards

- Use TypeScript everywhere.
- Use async/await.
- Never use any.
- Prefer functional React components.
- Keep components focused.
- Use Server Components where appropriate.
- Use shadcn/ui components when possible.
- Keep business logic out of UI components.
- Always validate incoming API requests.
- Return consistent API responses.

# API Rules

Every endpoint must return

{
success,
message,
data
}

Always validate request bodies.

Never expose internal errors.

Use RESTful naming.

Implement pagination for list endpoints.

Support filtering and sorting where applicable.

# Database Rules

Use UUID primary keys.

createdAt

updatedAt

Soft delete where applicable.

Never write raw SQL unless necessary.

Always use Prisma.

# Performance Rules

Lazy load images.

Use Next.js Image.

Use code splitting.

Paginate lists.

Optimize bundle size.

Cache wherever appropriate.

Never fetch unnecessary data.

# SEO Rules

SEO is mandatory.

Every public page must include

- title
- meta description
- canonical URL
- Open Graph
- Twitter cards
- JSON-LD schema
- Breadcrumb schema
- Sitemap support

Never create a public page without SEO metadata.

# AI Working Rules

Before writing code:

1. Read the existing implementation.
2. Reuse existing components.
3. Check if the functionality already exists.
4. Explain the implementation plan.
5. Then implement.

Never assume.

Ask when requirements are ambiguous.

Do not rewrite working code.

Prefer incremental improvements.

Maintain consistency with previous decisions.

# Project Priorities

Priority 1
Consistency

Priority 2
Performance

Priority 3
SEO

Priority 4
Accessibility

Priority 5
Developer Experience

Priority 6
Visual polish

# Definition of Done

A feature is complete only when:

✓ Responsive
✓ Accessible
✓ SEO complete (public pages)
✓ Error handled
✓ Loading states implemented
✓ Empty states implemented
✓ Uses existing components
✓ Matches design system
✓ Type-safe
✓ Tested

## Pages planned (build order: page by page, one consistent design system)
Home ✅ (built) → Search Results → Business Details → Category Page → City Page → Compare Businesses → Pricing → About → Contact → Login → Register → User Dashboard → Business Dashboard → Add Listing → Analytics → Admin Dashboard

## Subscription tiers (finalized — do not renegotiate, just implement)
| Feature | Basic | Premium | Elite |
|---|---|---|---|
| Cover photos | 1 | Up to 15 | Up to 25 |
| WhatsApp contact button | No | Yes | Yes |
| Badge | None | Verified | Trusted + Top-rated |
| Videos | 0 | 1 | 5 |
| Leads | None | Normal | Advanced |
| Search boost | None | Medium | Highest (Top 5) |
| Monthly report, QR code, market share, service-area suggestions, top-rated eligibility | No | Yes | Yes |
| Team management | No | No | 3–4 seats |
| Branch control | No | No | Up to 2 |
| Business Reputation Index, premium profile layout, early access | No | No | Yes |

Ranking rule: Elite > Premium > Basic always, in every search/category result set.

## Tech stack (fixed)
Frontend: Next.js, React, TypeScript, TailwindCSS
Backend: Node.js, Express, Prisma ORM, PostgreSQL, Redis, BullMQ
Storage: Cloudinary · Maps: Google Maps API
Hosting: Vercel (frontend) + Railway (backend/data) + Cloudflare (CDN/DNS)
SEO is a launch-blocking priority: SSR/SSG/ISR, schema markup (LocalBusiness/Review/FAQ/Breadcrumb), programmatic category×city pages, sitemap/robots.txt.

## Initial data / listing seeding strategy
Hybrid: a managed scraping platform (Apify Google Maps Scraper / Outscraper) as the default extraction engine, plus the official Google Places API selectively for priority cities/categories — both behind one internal `DataSourceAdapter` so the vendor isn't hard-coupled. Pipeline: geo-tiled query planning → staging table → category-taxonomy mapping → dedup (by place_id, fallback fuzzy name+phone+geohash) → geocode validation → import as `unclaimed` (lower-trust display, no dashboard/analytics until claimed) → automated claim-invite via SMS/WhatsApp. Unclaimed listings refresh quarterly; claimed listings are owner-maintained. Scraping is time-boxed per city, not a permanent pipeline.

## Documents already produced (attach alongside this brief as Project Knowledge)
- `Hubigo-BRS.docx` — Business Requirements Specification (vision, goals, stakeholders, scope, business rules, risks, revenue model, success metrics)
- `Hubigo-SRS.docx` — Software Requirements Specification (IEEE 830-style: FR-IDs per module, NFRs, API/DB requirements, security, the data acquisition strategy above as Section 21, acceptance criteria)
- `hubigo-homepage.html` — the built homepage (single-file HTML/CSS/JS), first page in the design system

## Working style / what to do in this Project
- Continue building pages **one at a time**, reusing the exact color tokens, spacing, type, and component patterns already established in the homepage (navbar, business card, section header, etc.) — don't introduce a new visual language per page.
- When adding new functional detail, keep the BRS/SRS internally consistent (matching FR-IDs, business rules, and the tier matrix above) rather than contradicting them.
- Treat the subscription matrix and business rules (e.g., Elite > Premium > Basic ranking, WhatsApp gated above Basic, verified reviews require a tracked interaction) as fixed inputs.
