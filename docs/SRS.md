# Hubigo — System Reference

**Software Requirements & Reference Specification**
Product: findhubigo.com · Stack: Next.js 16 (frontend) + Express/Prisma (backend) + PostgreSQL · Hosting: Railway
Document version: 1.1 — August 2026 (updated: Cloudflare edge layer, private networking, search ranking changes, operational pitfalls added — §16, §19)

> A rendered, visually-formatted version of this document is available as a published Artifact (see conversation history). This file is the version-controlled source of truth — keep it updated as the system changes.

---

## 1. Overview & Scope

Hubigo is a two-sided local-business directory for India: consumers search for businesses by category, location, or free text; business owners claim, manage, and grow a listing. The platform layers three distinct systems on shared data — a public consumer site, a business-owner dashboard, and an internal admin console — each with its own authentication mechanism (§7).

A large share of engineering effort goes into two things that don't show up as "features": **search relevance** (ranking free-text queries against structured data with no dedicated search index) and **programmatic SEO** (auto-generating and gating ~12,600 category/city/area landing pages so search engines index only the ones with enough real content to be worth indexing). Both are covered in §8 and §13.

This document reflects the system's actual current implementation. Intentionally incomplete/deferred items are called out in §17 rather than glossed over.

---

## 2. System Architecture

Two independently deployed Railway services share one PostgreSQL database. The frontend never talks to Postgres directly — all data access is mediated by the Express API.

```
Browser / Googlebot
      │  findhubigo.com (DNS proxied through Cloudflare)
      ▼
Cloudflare edge — Bot Fight Mode, WAF custom rules, rate limiting, cache rules (§16)
      ▼
Next.js 16 Frontend (Railway)
      │  REST, credentials:include             │ same-origin proxy (admin only)
      ▼                                          ▼
Cloudflare edge (api.findhubigo.com also proxied)
      ▼
Express API — api.findhubigo.com (Railway)    (loops back into the frontend itself)
      │
      ├──> PostgreSQL (Railway)
      ├──> Cloudflare R2 (business / badge / docs / avatars buckets)
      ├──> Sentry (error tracking)
      ├──> Resend (transactional email)
      ├──> Google OAuth
      └──> Web Push (VAPID)

Frontend also talks directly to: Google Analytics 4, Sentry (browser + edge)

Server-side (SSR/ISR) frontend→backend calls prefer Railway's private network
(backend.railway.internal) over the public/Cloudflare-proxied URL when available — see §16.
```

- **Frontend (findhubigo.com)** — Next.js 16 App Router, Server Components by default. Renders the public site, business-owner dashboard, and admin console from one codebase. Talks to the backend directly from the browser for consumer/business-owner data; admin traffic instead goes through same-origin Next.js Route Handlers that proxy to the backend (see §7 for why).
- **Backend (api.findhubigo.com)** — Express + Prisma, all routes under `/api/v1`. Owns every DB write/read. Search, ranking, and pSEO-candidate computation are raw SQL (`$queryRaw`), not Prisma's query builder, for control over query plans at directory scale.

Both custom domains (`findhubigo.com`, `www.findhubigo.com`) are registered on the frontend Railway service; a host-based redirect in `middleware.ts` canonicalizes `www` → apex before it reaches any page logic.

---

## 3. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Next.js 16.2.12 (App Router, Turbopack) | React 19.2.4 / react-dom 19.2.4 |
| Frontend language | TypeScript ^5 | Strict mode |
| Styling | Tailwind CSS ^4 | CSS-first config, no `tailwind.config` file |
| Icons | lucide-react | Used pervasively, no other icon set |
| Frontend auth (Edge) | jose | Verifies the admin session JWT in `middleware.ts` |
| Backend runtime | Node.js + Express ^4.21 | CommonJS output, `tsx` in dev / `tsc` build for prod |
| ORM / DB access | Prisma ^6.3 + PostgreSQL | Raw `$queryRaw` for search, ranking, geo, pSEO aggregation |
| Validation | Zod ^3 | Env schema + all request-body/query schemas, both sides |
| Auth (consumer) | jsonwebtoken + passport-google-oauth20 | Access-token JWT + opaque hashed refresh cookie; Google OAuth is the only sign-in path |
| Auth (admin) | jsonwebtoken + bcryptjs + custom TOTP | Fully separate secret and session model from consumer auth |
| File uploads | multer (memory) → Cloudflare R2 via @aws-sdk/client-s3 | Falls back to local disk if R2 isn't configured |
| Error tracking | Sentry (@sentry/node, @sentry/nextjs) | Server, browser, edge runtimes; inert without a DSN |
| Email | Resend | Logs to console instead of sending if unconfigured |
| Push notifications | web-push (VAPID) | Optional, gated on VAPID keys |
| Analytics | Google Analytics 4 (gtag.js) | Manual page_view firing on App Router client navigations |
| Testing | Playwright | E2E only, no unit-test framework found |
| Hosting | Railway (2 services + managed Postgres) | Auto-deploys both services from every push to `main`, no staging environment |

**Notably absent by design:** no client-side state-management library (React Context only), no form library (hand-rolled with `useState`), no maps SDK, no UI component library — every primitive in `app/components/ui/` is hand-built with Tailwind.

---

## 4. Technology Choices — Rationale

Why each major piece was picked, and what it was picked over. Written honestly — every choice below has a real trade-off, not just an upside.

### Next.js 16 (App Router) over a plain React SPA or a traditional CMS
A directory site's core traffic driver is search-engine indexing of ~12,600 pSEO pages (§13) — a client-only SPA (Create React App/Vite) can't be crawled reliably without extra infrastructure, since search engines need real HTML per URL, not a JS-rendered shell. Next.js gives that for free via Server Components and `generateMetadata`, with `revalidate`-based ISR to keep pages fresh without paying full static-build cost at this URL volume (full static generation of 12,600+ pages would make every deploy slow and most of those pages would rarely change). A traditional CMS (WordPress, etc.) was ruled out because the site's real logic — location-aware search ranking, the pSEO indexability gate, competitor-lead routing — is custom application logic, not content templating; forcing that into a CMS's plugin model would fight the tool at every step.

**Trade-off accepted:** App Router is young enough that some APIs (`generateSitemaps()`, at least in 16.2.12 + Turbopack) have real bugs that had to be worked around (§13) — a more mature framework would have fewer surprises, at the cost of weaker SSR/SEO ergonomics.

### PostgreSQL over MySQL or a NoSQL store (MongoDB, etc.)
The data model is heavily relational — a business has categories, amenities, hours, media, reviews, leads, and claims, all genuinely needing joins and referential constraints, not documents. Postgres specifically (over MySQL) was chosen for its stronger support for the things this app leans on hardest: window functions and CTEs (the two-stage `base_candidates` search query, §8), geo math directly in SQL (Haversine distance for nearby/competitor-lead queries), and `$queryRaw` as a first-class escape hatch when the ORM's query builder can't express something efficiently. A document store was ruled out early — search ranking and pSEO aggregation are fundamentally set-based, cross-entity operations that documents make harder, not easier.

### Prisma over a raw query builder (Knex) or a heavier ORM (TypeORM/Sequelize)
Prisma's generated types flow end-to-end from the schema into every service and controller, which matters a lot given how large the schema is (§4) — a raw SQL builder would leave every field name unchecked at compile time across dozens of tables. But Prisma's query builder isn't used for the hot paths (search, ranking, pSEO aggregation) — those go through `$queryRaw` directly, because Prisma's builder can't efficiently express the CTE-based, multi-stage queries those paths need. This is a deliberate middle ground: type-safe migrations and simple CRUD through Prisma, full SQL control where performance actually matters.

### Express over Fastify or NestJS
Express was chosen for being the least opinionated option — a REST API this shape (controllers → services → repository, no GraphQL, no microservices) doesn't need Nest's dependency-injection framework or module system, which adds real structure but also real ceremony for a single small team. Fastify would have been a reasonable, faster alternative; Express was picked for its larger ecosystem of middleware (helmet, passport, multer, express-rate-limit all used directly) and the fact that raw request/response performance was never the bottleneck here — the database query patterns were (§8's fix moved a multi-second regression to ~150ms without touching the web framework at all).

### Railway over AWS/GCP or Vercel+separate DB
Railway gives one dashboard for both services, managed Postgres, git-push auto-deploy, and custom-domain/cert management (including the `www` subdomain fix documented in this project's history) — all without provisioning VPCs, IAM policies, or load balancers by hand. For a small team, that operational simplicity is worth more right now than AWS's greater ceiling. Vercel (a natural pairing for Next.js) was not chosen for the whole stack because it doesn't run a persistent Express process the way this backend needs (its serverless functions model fits a different backend architecture than the one already built).

**Trade-off accepted:** no staging environment exists yet (§17), and Railway's single-project model means frontend and backend share operational blast radius more than a more segmented AWS setup would — acceptable at current scale, worth revisiting before a major traffic jump.

### Cloudflare R2 over AWS S3
Both are S3-API-compatible, so the code (`@aws-sdk/client-s3`) is identical either way — R2 was chosen specifically because it has **no egress fees**, which matters directly for an image-heavy business directory serving cover photos, galleries, and badges to every visitor. S3 would cost meaningfully more at the same traffic pattern for identical functionality.

### Zod over relying on TypeScript types alone
TypeScript types disappear at runtime — they can't stop a malformed request body or a broken `.env` file from reaching application code. Zod is used for exactly the two places that matters most: environment-variable validation at startup (`config/env.ts` — the process refuses to boot on a bad config, rather than failing confusingly at first use) and request validation (`schemas/*.schema.ts` — one shared validation library on both frontend and backend, so the same rules can't drift apart between the two).

### Google OAuth as the only sign-in method (no password login)
Deliberately narrows the auth surface: no password storage to secure, no password-reset-token flow to build and defend, no credential-stuffing risk against Hubigo's own login form. The trade-off is real — a user without a Google account has no way in — but for the target audience (India, mobile-heavy, Google account near-ubiquitous via Android) this was judged an acceptable narrowing in exchange for meaningfully less auth surface to secure and maintain. `User.passwordHash` still exists in the schema as a forward-compatible column, unused.

### Tailwind CSS v4 over a component library (MUI, Chakra) or hand-written CSS modules
A directory site's UI is highly custom (dense listing cards, comparison tables, admin data grids) — a component library's defaults would need overriding almost everywhere, fighting the tool rather than benefiting from it. Tailwind's utility classes keep styling co-located with markup across a large number of one-off layouts, and v4's CSS-first config removes the separate `tailwind.config.js` build step entirely. The cost is accepted verbosity in JSX class lists, traded for not maintaining a growing custom CSS file per component.

---

## 5. Data Model

PostgreSQL via Prisma. Source of truth: `backend/prisma/schema.prisma`.

### User & Session Domain

| Model | Purpose | Key fields / constraints |
|---|---|---|
| `User` | Consumer / business-owner account (same table, differentiated by `role`) | `email`/`phone` unique; `role`: user·business_owner·admin·super_admin (admin values unused in practice — see §7); soft delete via `deletedAt`; onboarding fields |
| `OAuthAccount` | Google OAuth identity link | `@@unique([provider, providerUserId])` |
| `RefreshToken` | Opaque, rotated session refresh token | `tokenHash` unique — raw token never stored |
| `VerificationToken` | Email verification / password reset | hashed, single-use (`usedAt`) |
| `SavedBusiness` | User's saved listing | `listingId` is a plain string, deliberately *not* a relation to `Business` — decouples saves from re-import cascades |
| `SavedSearch` | Saved search criteria | keyword / category / city as plain fields |

### Business & Listing Domain

| Model | Purpose | Key fields / constraints |
|---|---|---|
| `Business` | The central listing entity | `slug` unique; `status` default **approved** (self-listing goes live immediately, no v1 moderation queue); denormalized `avgRating`/`reviewCount`; `externalPlaceId` unique (scraper dedup key) |
| `Category` | Hierarchical taxonomy | Self-relation `parent`/`children`; `slug` unique |
| `City` / `Locality` | Geographic taxonomy | `City.isAutoCreated` flags a city created ad-hoc by a self-listing owner |
| `PincodeArea` | Pincode → area-name lookup, powers **area-level pSEO pages** | Distinct from Locality — one pincode can map to 2 real area names |
| `Amenity` | Feature tags | Joined via `BusinessAmenity` (composite PK) |
| `BusinessCategory` | Business ↔ Category join | `isPrimary` flag drives search ranking and pSEO grouping |
| `BusinessService` / `BusinessHours` / `BusinessMedia` / `Offer` | Listing detail sub-tables | `BusinessHours`: `@@unique([businessId, day])` |
| `BusinessDescriptionTemplate` | Pre-written overview copy, 20 per subcategory | Seeded from static JSON — no runtime LLM dependency |
| `Review` | Consumer review | `status` default PENDING but publishes immediately in the current flow |
| `SearchLog` | Anonymized query log | Source for "Popular Searches" |

### Monetization, Claims & Moderation

| Model | Purpose | Key fields / constraints |
|---|---|---|
| `Subscription` | Billing history | `plan`: FREE·PRO·PREMIUM·ENTERPRISE |
| `BusinessClaim` | Ownership-claim request (Step 1) | phone/OTP auto-approves; GST/MSME requires admin review |
| `BusinessVerification` | Optional "Verified" trust badge (Step 2) | Separate from BusinessClaim; only flow that flips `Business.isVerified` |
| `Otp` | OTP for updating a claimed business's public phone | Not used for the claim flow itself |
| `BusinessEdit` | Proposed detail edit, queued for moderation | `changes` Json; `ApprovalStatus` |
| `Lead` | A contact/enquiry event | `type`: VIEW·CALL·EMAIL·WHATSAPP·FORM; `sourceBusinessId` set only for "competitor spillover" leads (§8) |
| `ContactMessage` | Site-wide Contact Us submission | Distinct from `Lead`, which always needs a businessId |
| `BusinessEditSuggestion` / `BusinessReport` | "Suggest an Edit" / "Report Listing" | Plain-string status |
| `Notification` / `PushSubscription` | In-app + browser push notifications | Sent together by `push.service.ts` |
| `ActivityLog` | Security/compliance audit trail | Nullable `userId` for pre-auth events |

### Admin Console Domain (entirely separate from `User`)

| Model | Purpose | Key fields / constraints |
|---|---|---|
| `AdminUser` | Admin console account | `email` unique; `roleId` → AdminRole |
| `AdminRole` | RBAC role | `permissions String[]`; `"*"` = superadmin wildcard |
| `AdminSession` | Server-side session backing the admin JWT | `token` unique = the JWT's `sid` claim — lets logout/deactivation take effect instantly |
| `AdminAuditLog` | Every admin action | `action`, `targetType`, `targetId`, `details` Json |

### Business Dashboard Domain

| Model | Purpose | Key fields / constraints |
|---|---|---|
| `Product` | Business's product/service catalog | price, image, availability, sort order |
| `Appointment` | Booking entries | `status`: PENDING·CONFIRMED·COMPLETED·CANCELLED·NO_SHOW |
| `BusinessTeamMember` | Dashboard-access grant, distinct from the single claiming owner | Hashed invite token |
| `Conversation` / `Message` | Customer ↔ business inbox | `customerUserId` nullable (anonymous senders) |
| `Advertisement` | Paid placement slots | `placement`: HOME_BANNER·CATEGORY_TOP·SEARCH_SPONSORED |
| `ImportJob` | Tracks one CSV/XLSX bulk-import run | Row counters; powers the admin Imports screen |

> By deliberate convention, satellite tables (`BusinessClaim`, `Lead`, `Advertisement`, etc.) reference `businessId` as a **plain scalar string**, not a Prisma relation — keeps `Business` free of a matching back-relation array for every table that touches it, at the cost of losing ORM-level cascade/referential-integrity enforcement for those links.

---

## 6. API Reference

All endpoints mounted under `/api/v1`. Static uploads (local-disk fallback) served from `/uploads`. Unversioned health check at `GET /health`.

### Public — Search & Directory
- `GET /search`, `/search/suggestions`, `/search/popular`
- `GET /nearby`
- `GET /businesses/compare`, `/compare/nearby`
- `GET /businesses/:slug`
- `GET /categories`, `/cities`, `/amenities`, `/stats`, `/offers`, `/popular`
- `GET /cities/:citySlug/localities`, `/cities/:citySlug/areas/:areaSlug`
- `GET /pseo/sitemap-entries`, `/pseo/resolve-search`

### Consumer — Account, Reviews, Claims
- `GET/POST /auth/google`, `/auth/google/callback` — sole sign-in path, no password login exists
- `POST /auth/refresh`, `/auth/logout`
- `GET/PATCH /users/me`, `POST /users/me/onboarding`
- `/users/me/saved-businesses`, `/saved-searches`, `/notifications`, `/push-subscriptions`, `/avatar`
- `GET /users/me/conversations` — consumer side of the messaging inbox
- `POST /businesses` — self-service listing creation, live immediately
- `POST /businesses/:id/reviews` — publishes immediately, no moderation queue
- `POST /businesses/:id/suggest-edit`, `/report`
- `POST /businesses/:slug/interactions` — call/WhatsApp/view tracking → competitor-lead routing (§8)
- `POST /businesses/:id/claim/document`, `GET /businesses/:id/claim/status`
- `POST /contact`

### Business Owner Dashboard — `/businesses/me/*`
Mounted before the general businesses router so `/me` never collides with `/:slug`. Every route requires `requireAuth` + `requireOwnedBusiness`; multi-business owners switch context via an `x-business-id` header.

- Profile: `GET/PATCH /profile`, `PUT /profile/hours`, `/amenities`, `/categories`, `POST /profile/services`, `PUT /profile/logo`, `/cover`, `POST /profile/media`
- Offers: `GET/POST /offers`, `PATCH/DELETE /offers/:id`
- Leads: `GET /leads`, `PATCH /leads/:id/status`
- Reviews: `GET /reviews`, `POST /reviews/:id/reply`
- Appointments: `GET/POST /appointments`, `PATCH/DELETE /appointments/:id`
- Products: `GET/POST /products`, `PATCH /products/:id`, `DELETE /products/:id`
- Messages: `GET /conversations`, `GET /conversations/:id`, `POST /conversations/:id/messages`

### Admin Console — `/admin/*`
Every route requires `requireAdminAuth` (the separate `AdminUser`/`AdminSession` system — §7). Login at `/admin/auth/login`.

- Dashboard: `GET /dashboard/metrics`, `GET /analytics`
- Businesses: `GET /businesses`, `POST /businesses/:id/verify`, `/unverify`, `PATCH /businesses/:id/status`, `DELETE /businesses/:id`
- Claims: `GET /claims`, `POST /claims/:id/approve`, `/reject`
- Users: `GET /users`, `POST /users/:id/suspend`, `/activate`
- Reviews: `GET /reviews`, `POST /reviews/:id/approve`, `/flag`, `/spam`, `DELETE /reviews/:id`
- Leads / Contact / Feedback: `GET /leads`, `/contact-messages`, `/edit-suggestions`, `/listing-reports` + resolve/delete actions
- Imports: `POST /imports`, `GET /imports`, `POST /imports/:id/retry`
- Taxonomy & Geo: full CRUD on `/categories`, `/subcategories`, `/cities`, `/areas`
- Governance: `GET /audit-logs`, full CRUD on `/team` and `/roles`, `GET /settings`

---

## 7. Authentication & Authorization

Three **entirely independent** systems coexist — deliberately not unified, since a consumer session and an admin session must never be forgeable from one another.

### A — Consumer & Business Owner (same system)
- **Sign-in:** Google OAuth only. No password-based login route exists, despite `User.passwordHash` being present in the schema.
- **Access token:** short-lived JWT (default 15 min), payload `{sub: userId, role}`, returned via URL fragment on OAuth redirect, held only in React state — never localStorage.
- **Refresh token:** opaque random value, only its SHA-256 hash stored server-side, httpOnly/secure/sameSite=lax cookie (`hubigo_rt`) scoped to `/api/v1/auth`, default 30-day TTL. `POST /auth/refresh` rotates it and re-checks `isSuspended`/`deletedAt`.
- **Dashboard access:** `requireOwnedBusiness` middleware resolves the caller's claimed `Business`.

### B — Ownership Claim (two independent mechanisms)
- `BusinessClaim` — document upload, admin-reviewed (GST/MSME) or auto-approved (phone/OTP)
- `BusinessVerification` — separate, optional "Verified" trust badge, admin-approved only

### C — Admin Console (fully separate — never touches `User`)
1. Login email must be on the `ADMIN_ALLOWED_EMAILS` allowlist, checked before any DB lookup
2. `AdminUser.passwordHash` (bcrypt, 12 rounds) verified
3. Shared-secret TOTP 2FA code verified against `ADMIN_2FA_SECRET`
4. Creates a server-side `AdminSession` row + signs a JWT with a secret (`ADMIN_JWT_SECRET`) deliberately different from consumer `JWT_ACCESS_SECRET`

`requireAdminAuth` verifies the JWT *and* re-checks the `AdminSession` row server-side — logout/deactivation take effect immediately, not at JWT expiry.

> **Why the admin console uses a Next.js proxy layer:** `middleware.ts` runs at the Edge and can only read cookies set on the frontend's own origin. `app/api/admin/login/route.ts` logs in against the backend, then sets its own `hubigo_admin_session` cookie on the frontend's origin — this is what makes real server-side route protection for `/admin/*` possible. All admin API calls flow through one catch-all proxy, `app/api/admin/data/[...path]/route.ts`. No admin bearer token is ever held client-side.

> **Gap:** the admin console has real server-side (Edge middleware) route protection. The business-owner dashboard does **not** — its role gate is a client-side `useEffect` redirect only. See §17.

---

## 8. Core Business Logic

**Search ranking** (`backend/src/repositories/business.repository.ts`) — free-text queries parse out a location phrase (matched against an in-memory 5-min-TTL cache of city/locality/area names, avoiding a non-indexable `ILIKE '%name%'` full scan) and combine it with category/text matching into a composite relevance score. Execution is two-staged: a cheap `base_candidates` CTE filters/pre-sorts to a bounded pool (3,000 rows) *before* expensive per-row work (reviews aggregate, area lookup, distance) runs.

**Distance sort vs. text relevance** — distance-primary sort applies only for query-less browsing with a real GPS fix. A location phrase in free text ("in Whitefield") is a scoring signal only, never a literal coordinate.

**`best_match` nearest-first for generic/chain queries** (`buildOrderBy()` in `business.repository.ts`) — a query that resolves to many essentially-interchangeable results (matches a category/subcategory name — "medical shops" — or resolves to multiple businesses sharing the same/near-identical name — chain branches, or a common name like "Udupi Hotel") sorts nearest-first by default, since relevance can't meaningfully distinguish between them. A query that resolves to one specific, uniquely-named business is unaffected and stays on relevance (`score DESC`) ranking. Detected via `category_match_tier > 0 OR name_match_count > 1` (a window-function count of same-named rows in the result set).

**"Top/Best X in Y" → pSEO shortcut** — resolved server-side by fuzzy-matching category/location text against cached taxonomy, then checking the pSEO indexability gate (§13). Falls back from area-level to city-level page if the area combo doesn't have enough businesses to qualify.

**Competitor-lead routing** (`competitor-leads.service.ts`) — when a logged-in user views/calls/WhatsApps a **basic**-plan business, the 2 nearest same-primary-category **paid**-plan businesses each also receive a "competitor lead" (Haversine-ranked). Paid businesses' own leads are never routed away. Deduplicated to one lead per user+business+source ever.

---

## 9. Error Handling

Central handler: `middleware/errorHandler.ts`, registered last. Controllers wrapped in `asyncHandler` so async errors reach it automatically.

| Error type | Response |
|---|---|
| `ApiError` | Its own status code; only 5xx reported to Sentry |
| `MulterError` | 400, friendly message |
| `ZodError` | 400, flattened field errors |
| Unhandled | 500, logged + Sentry; raw error never leaked in production |

`utils/prisma-errors.ts`'s `isForeignKeyViolation()` — Prisma maps common FK violations (SQLSTATE 23503) to a known code, but a `RESTRICT`-constraint violation (SQLSTATE 23001) surfaces as an opaque `PrismaClientUnknownRequestError`; without a fallback message check, a RESTRICT-blocked delete would fall through to a generic 500 instead of a `409 Conflict`.

---

## 10. External Integrations

| Service | Used for | Degrades to, if unconfigured |
|---|---|---|
| Cloudflare R2 | 4 buckets — business images, badges, claim docs, avatars | Local disk fallback |
| Sentry | Error tracking, all runtimes | Fully inert |
| Resend | Transactional email | Logs to console |
| Google OAuth | The only consumer sign-in path | 503 `OAUTH_NOT_CONFIGURED` |
| Web Push (VAPID) | Browser push alongside in-app notifications | Silently unavailable |
| Google Analytics 4 | Frontend traffic analytics | — |

Nearly every integration is optional at the env-var level — the app degrades gracefully rather than crashing. Only `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` are hard requirements.

---

## 11. Frontend Route Structure

Three route trees share one Next.js app: `app/(main)/` (public site), `app/(dashboard)/business-dashboard/` (owner dashboard), `app/admin/` (admin console).

### pSEO template routes
- `/category/[slug]` — category × all India
- `/category/[slug]/[citySlug]` — category × city
- `/city/[slug]` — city hub
- `/category/[slug]/[citySlug]/[areaSlug]` — category × city × area (most granular)

None use `generateStaticParams` — all render on-demand with `revalidate = 3600` (ISR), matching the ~12,600-URL scale. Every page follows the same pattern: a Server Component `page.tsx` handles `generateMetadata()` + data fetch + `notFound()` gating, handing off to a co-located `*Client.tsx` for interactivity.

Other notable pages: `/search` (client, URL-driven state), `/oauth/callback`, `/business/[slug]/claim`, `/account-suspended`, `app/global-error.tsx`, `app/not-found.tsx`.

---

## 12. Components & State

| Folder | Contents |
|---|---|
| `components/sections/` | Homepage building blocks |
| `components/layout/` | Global chrome |
| `components/search/` | SearchInputBar, filters, sort, result cards, compare panel |
| `components/ui/` | Hand-built primitives |
| `components/pseo/` | `PseoBusinessGrid` — shared across all 4 templates |
| `components/seo/` | `JsonLd.tsx` |
| `admin/components/` | Kept separate from the shared tree |

**State:** React Context only — `AuthProvider`, `AdminAuthProvider` (fully separate), `CityProvider`, `NotFoundProvider`.

**API client:** `app/lib/api.ts` — attaches bearer token, always `credentials:"include"`, retries idempotent GETs only (never POST/PATCH/DELETE) up to twice on 5xx. Admin traffic uses a separate client that always calls the same-origin proxy.

---

## 13. Programmatic SEO

A single shared gate function, `evaluatePseoGate(count)` in `app/lib/pseo-thresholds.ts`, decides page existence and indexability for every template — used identically by page templates, their `robots` metadata, and the sitemap builder.

| Threshold | Default | Effect |
|---|---|---|
| `PSEO_MIN_EXIST` | 1 | Below this, the page 404s |
| `PSEO_MIN_INDEXABLE` | 16 | Below: exists but noindex,follow. At/above: indexable |
| `PSEO_HIGH_DENSITY_AT` | 50 | Informational density tier only |
| `PSEO_DISPLAY_LIMIT` / `PSEO_MAX_EXPOSED` | 20 / 200 | First SSR batch / hard ceiling across all "Load More" |

Indexability is applied per-page via `generateMetadata → robots` — never via `robots.txt`, which can't do per-page logic. `app/sitemap.ts` combines static, directory, and pSEO entries into one unchunked file (a Next 16.2.12 + Turbopack bug silently breaks the chunked `generateSitemaps()` API). Every `lastModified` is real, never fabricated.

---

## 14. Search System (Frontend)

`app/lib/search-api.ts` is the typed client for all directory data. `/search` keeps filter/sort/page state URL-driven:
- A bare city name redirects to `/city/[slug]` if supported, or shows a "not here yet" state if known-but-unsupported.
- Distance sort requires a real GPS/geocoded fix — never a silent default.
- The homepage hero uses a separate, simpler input than the shared `SearchInputBar` — both independently implement the "top/best X in Y" shortcut via a shared `resolveTopSearchOrFallback()` helper to stay in sync.

---

## 15. Environment Reference

Validated at backend startup via Zod (`config/env.ts`) — the process refuses to start on failure.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes (min 32 chars) | Consumer session signing |
| `FRONTEND_URL` | No | CORS allowlist + OAuth redirect target |
| `GOOGLE_CLIENT_ID` / `_SECRET` / `GOOGLE_CALLBACK_URL` | No (paired) | Google OAuth |
| `R2_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY` / `_ENDPOINT` | No (all 3) | Cloudflare R2 credentials |
| `R2_BUSINESS_BUCKET`, `R2_BADGE_BUCKET`, `R2_DOCS_BUCKET`, `R2_PROFILE_PICS_BUCKET` (+`_URL`) | No | 4 logical storage buckets |
| `ADMIN_ALLOWED_EMAILS` | No | Admin login allowlist |
| `ADMIN_2FA_SECRET` / `ADMIN_JWT_SECRET` | No (min 16/32 chars if set) | Admin TOTP + session signing — must match frontend `middleware.ts` |
| `RESEND_API_KEY` / `EMAIL_FROM` | No | Transactional email |
| `VAPID_PUBLIC_KEY` / `_PRIVATE_KEY` / `_SUBJECT` | No (paired) | Web Push |
| `SENTRY_DSN` | No | Error reporting |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Frontend error reporting |

---

## 16. Deployment & Infrastructure

- **Railway** hosts both services (frontend, backend) plus managed PostgreSQL, one project. Each service auto-deploys on every push to `main` — **no staging environment.**
- Custom domains: `findhubigo.com` + `www.findhubigo.com`, both on the frontend service. DNS is now managed by **Cloudflare** (nameservers moved from Hostinger, 2026-08-19) — both the apex/`www` and `api.findhubigo.com` are **proxied** through Cloudflare, not DNS-only. `middleware.ts` still 301-redirects `www` → apex.
- Backend at `api.findhubigo.com`; CORS locked to `FRONTEND_URL` with credentials enabled.
- `app.set("trust proxy", 1)` — **do not trust this for anything security-sensitive.** Under real traffic load, `req.ip` on Railway has been observed resolving to the wrong address entirely (confirmed via a temporary `/debug/ip` diagnostic route) — a real visitor's request was resolved to a *different, unrelated* client's IP. Any IP-based access control belongs at Cloudflare's edge (WAF custom rules, using Cloudflare's own IP determination), never in Express via `req.ip`.

### Cloudflare edge layer (added 2026-08-19 onward)

The site sits behind Cloudflare for both the frontend and API domains. Current live configuration:

- **Bot Fight Mode**: on (free tier). Catches some automated/malicious traffic via IP reputation and challenge-based heuristics; does **not** reliably catch a determined actor making direct, low-volume API calls with no browser context (JS challenges can't run against a raw HTTP client) — see the AS60068 note below.
- **WAF custom rule** — blocks `AS Num equals 60068` (Datacamp Limited / DataPacket), a commercial proxy/hosting network confirmed via reverse-DNS + ASN lookup to be running a persistent scraper against `/api/v1/search` and `/api/v1/businesses/*`. Imperfectly effective in practice — traffic from this actor has still been observed reaching the origin despite this rule being Active; not fully root-caused.
- **Rate limiting rule** — `/api/v1/*`, more than 10 requests per 10 seconds from one IP → Block for 10 minutes (free-plan-fixed period/duration; only the request count is adjustable).
- **Cache Rule** — `/api/v1/search` and `/api/v1/categories` (GET) are edge-cached for 30s, ignoring origin `Cache-Control` (the origin doesn't set one). Reduces DB load from repeated/rapid identical queries regardless of who's making them; real users see at most 30s-stale results.
- **A previous custom rule, "Block API scraping"** (`URI Path starts with /api/v1/ AND Known Bots does not equal true` → Managed Challenge) was deployed and then **disabled** after it was found to challenge essentially all real traffic — "Known Bots != true" matches ordinary visitors too, not just suspicious ones. Do not recreate this exact condition; if bot-detection-gated rules are wanted again, pair volume/ASN signals instead of a bare "not a known good bot" check.
- **`verifyOrigin` middleware** (`backend/src/middleware/verifyOrigin.ts`) exists in code to reject requests that reach Railway's origin directly (bypassing Cloudflare) via a Cloudflare Transform Rule injecting a shared secret header. **Currently disabled** (the `CF_ORIGIN_SECRET` env var is unset, which no-ops the check) after real user traffic was intermittently rejected by it for reasons not fully root-caused (suspected: a since-corrected wrong secret value that may have gotten cached at Cloudflare's edge for affected users, though a Cache Rule bypassing this wasn't confirmed to fix it before it was rolled back). Re-enabling requires setting `CF_ORIGIN_SECRET` on the backend to match the Cloudflare Transform Rule's value, and should be tested carefully (multiple real browsers/networks, not just synthetic requests) before being trusted again.

### Private networking (server-side fetches)

`app/lib/api.ts`'s `resolveBaseUrl()` uses `INTERNAL_API_URL` (Railway's private network, `backend.railway.internal`) for server-side (SSR/ISR) fetches when that env var is set, falling back to the public `NEXT_PUBLIC_API_URL` otherwise. Client-side (browser) requests always use the public URL — the private address is unreachable from a browser by design.

**Critical limitation: this only works for the *deployed, running* container — not during `next build`.** Railway's build step runs in an isolated sandbox that is on neither the private network (DNS for `backend.railway.internal` doesn't resolve there) nor able to reliably reach the public URL (Cloudflare's abuse detection has flagged the build's rapid sequential requests). Practical consequence: **any page without dynamic route params that fetches live backend data must not be build-time static** — use `export const dynamic = "force-dynamic"` instead of relying on default static generation (a plain `export const revalidate = N` still gets attempted at build time if the route has no dynamic segments). Pages with dynamic segments (`[slug]`, etc.) and no `generateStaticParams` are unaffected — Next.js already defers those to first real request. As of this doc: `app/page.tsx`, `app/sitemap.ts`, `app/(main)/category/page.tsx`, and `app/(main)/city/page.tsx` are set this way for exactly this reason.

- Non-R2 uploads fall back to local disk on the Railway container's ephemeral filesystem — **does not persist across redeploys**, which is why R2 is the primary path.

---

## 17. Known Gaps & Roadmap Notes

Documented explicitly as conscious current-state tradeoffs, not oversights:

- **Business dashboard has no server-side auth gate.** Role/ownership checks are client-side only; kept out of search indexing via `robots.ts`, but that isn't access control. Fix: extend `middleware.ts`'s Edge protection (currently admin-only) to `/business-dashboard/*`.
- **No moderation queue for v1.** Self-service listings and reviews both go live immediately without human review, despite admin moderation tooling existing.
- **Unused schema surface.** `User.role` includes `admin`/`super_admin` values nothing assigns (real admin system is separate); `User.passwordHash` exists but no route uses it.
- **No staging environment.** Every push to `main` deploys straight to production on both services.
- **Referential integrity gaps by design.** Several tables reference `businessId` as a plain scalar, not a relation — no automatic cascade cleanup at the DB level.

---

## 18. Operational Pitfalls (learned the hard way — read before touching infra/caching)

Real incidents from this project's history, kept here so they aren't repeated:

- **`revalidate` + swallowing a fetch error is a trap.** A page pattern like `const data = await getX().catch(() => fallback)` combined with `export const revalidate = N` means: if the backend has *any* transient hiccup (a deploy, a brief network blip) exactly when Next.js runs a background revalidation, the fallback/empty/not-found result gets **cached as if it were correct** for the entire revalidate window — up to an hour, silently, with no error visible anywhere. This caused two real "everything is 404" incidents. Fix, applied where discovered: use `isNotFoundError()` (`app/lib/api.ts`) to only treat a genuine backend `404` as "this doesn't exist" — let every other error (network failure, 5xx) propagate uncaught, so Next.js's ISR falls back to serving the last good cached version instead of overwriting it with a broken one. Any new page using `revalidate` with a data fetch should follow this pattern, not the swallow-everything one.
- **`req.ip` cannot be trusted on this Railway setup.** Confirmed via a temporary diagnostic route that Express resolved a real visitor's IP to a completely different, unrelated address under `trust proxy: 1`. Any IP-based logic (blocking, rate limiting, geolocation-sensitive decisions) must happen at Cloudflare's edge, not in Express middleware.
- **Cloudflare bot/security rules can silently break real traffic, not just block bots.** Two different rules did this in practice: a mis-scoped Transform Rule (wrong secret briefly deployed) and a WAF custom rule whose condition ("Known Bots does not equal true") matched ordinary visitors, not just suspicious ones. Any new Cloudflare security rule should be tested against real multi-device/multi-network traffic before being trusted, not just synthetic `curl` requests from one location — synthetic tests passed in both incidents while real users were still blocked.
- **Railway's build sandbox has no path to the backend.** Not the private network, and the public URL gets flagged by Cloudflare's abuse detection for the build's own automated request pattern. See §16's private-networking note — any new top-level page (no dynamic segments) that needs live backend data at build time will break the build entirely unless it's `force-dynamic`.
- **Scraper mitigation trade-off:** IP/UA-based blocking at the app layer is fragile (depends on the unreliable `req.ip` above) and was abandoned in favor of Cloudflare-edge controls (WAF ASN rule, rate limiting, response caching) — the latter don't depend on Express ever seeing a "wrong" IP, since Cloudflare determines the client IP itself. Full elimination of a determined scraper on the free Cloudflare tier hasn't been achieved; caching + rate limiting reduces its cost impact regardless of whether it's fully blocked.

---

## 19. Glossary

| Term | Meaning in this codebase |
|---|---|
| pSEO | Programmatic SEO — auto-generated category × city × area landing pages |
| Candidate pool | The bounded (3,000-row) pre-filtered result set search ranking runs expensive work against |
| Competitor lead | A lead routed to a nearby paid-plan business when a user interacts with a basic-plan competitor |
| Claim | The process by which a business owner takes ownership of an existing listing |
| Indexability gate | `evaluatePseoGate()` — the shared 16-business threshold for pSEO page indexability |
| BFF proxy | The Next.js Route Handlers under `app/api/admin/*` mediating all admin traffic to the backend |

---

*Compiled from the live codebase at `c:\Hubigo\hubigo`. Re-verify against source before relying on any specific field, route, or threshold in a change with real consequences.*
