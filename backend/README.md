# Hubigo Backend

Express + TypeScript + Prisma API serving:
- **Auth** — register, login, refresh, logout, email verification, password reset, Google OAuth, RBAC
- **User Profile** — edit profile, change password, avatar, saved businesses, saved searches, notification preferences
- **Search** — business search/ranking, autocomplete, filters, compare, taxonomy (categories/cities/localities/amenities)

## Setup

```bash
cd backend
npm install
```

Fill in `.env` (already created from `.env.example` with generated JWT secrets):

1. **`DATABASE_URL`** — a Postgres connection string. Railway is the project's database going forward (`postgresql://...@<host>.proxy.rlwy.net:<port>/railway`); any other Postgres provider works too.
2. **`RESEND_API_KEY`** — from [resend.com](https://resend.com). Without it, verification/reset emails are logged to the console instead of sent.
3. **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** — from Google Cloud Console → APIs & Services → Credentials → OAuth Client ID (Web application). Add `http://localhost:4000/api/v1/auth/google/callback` as an authorized redirect URI. Without these, `/api/v1/auth/google` returns 503.
4. **`R2_PROFILE_PICS_BUCKET` / `R2_PROFILE_PICS_BUCKET_URL`** (plus the shared `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT`) — Cloudflare R2 credentials for avatar storage. Without these, uploaded profile pictures are stored locally under `backend/public/uploads` and served from `BACKEND_URL` — fine for dev, not for production.

Then run the initial migration, apply the search extension/indexes, and seed reference + sample data:

```bash
npm run prisma:migrate         # creates all tables
npm run db:search-indexes      # REQUIRED — enables pg_trgm fuzzy matching; search 500s without this
npm run seed                   # permanent taxonomy: categories, cities, localities, amenities
npm run seed:mock-businesses   # ~25 isolated sample businesses so search/filters/compare have data
```

`seed:mock-businesses` is throwaway data for exercising the search stack before the scraper pipeline lands — remove it any time with `npm run seed:clear-mock-businesses` (only deletes rows tagged `externalPlaceId` starting with `MOCK-`; taxonomy and real imports are untouched).

Start the dev server:

```bash
npm run dev
```

Runs on `http://localhost:4000`. Frontend expects it there via `NEXT_PUBLIC_API_URL` (see `../.env.local`).

## Endpoints

All under `/api/v1/auth`, responses shaped `{ success, message, data, error? }`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | `{ name, email, phone?, password, role }`, role is `user` or `business_owner` |
| POST | `/login` | — | `{ identifier, password }`, identifier is email or 10-digit mobile |
| POST | `/refresh` | refresh cookie | Rotates the refresh token, returns a new access token |
| POST | `/logout` | refresh cookie | Revokes the refresh token |
| GET | `/me` | Bearer access token | Current user |
| POST | `/verify-email` | — | `{ token }` |
| POST | `/resend-verification` | — | `{ email }` |
| POST | `/forgot-password` | — | `{ email }` |
| POST | `/reset-password` | — | `{ token, password }` |
| GET | `/google` | — | Redirects to Google |
| GET | `/google/callback` | — | Redirects back to `FRONTEND_URL/oauth/callback#accessToken=...&user=...` |

All under `/api/v1/users`, Bearer access token required on every route.

| Method | Path | Notes |
|---|---|---|
| GET | `/me` | Current user (same shape as `/auth/me`) |
| PATCH | `/me` | `{ name?, email?, phone? }` — changing email flips `emailVerified` to false and sends a new verification link |
| PATCH | `/me/password` | `{ currentPassword, newPassword }` — revokes every other session, keeps this one alive |
| PUT | `/me/avatar` | `multipart/form-data`, field `avatar` (JPEG/PNG/WEBP, max 5MB) |
| DELETE | `/me/avatar` | Removes the current profile picture |
| PATCH | `/me/notifications` | Partial `{ emailLeadAlerts?, emailMarketing?, whatsappUpdates?, smsAlerts? }` |
| GET/POST | `/me/saved-businesses` | POST body: `{ listingId, name, category?, city?, imageUrl?, rating? }` |
| DELETE | `/me/saved-businesses/:id` | |
| GET/POST | `/me/saved-searches` | POST body: `{ label, keyword?, category?, city? }` |
| DELETE | `/me/saved-searches/:id` | |

**Note on saved businesses:** `SavedBusiness.listingId` is deliberately still a plain string, not a foreign key to `Business` — see the comment on that model in `schema.prisma`. Display fields are snapshotted at save time so the saved list survives a listing being deleted/re-imported.

### Search

No auth required. All under `/api/v1`.

| Method | Path | Notes |
|---|---|---|
| GET | `/search` | `q, category, subcategory, city, locality, pincode, lat, lng, radiusKm, openNow, verified, minRating, price, amenities, offers, tier, sort, page, limit` — see below |
| GET | `/search/suggestions?q=` | Autocomplete — businesses, categories, localities, cities, blended and ranked by trigram similarity |
| GET | `/search/popular` | Top queries from `SearchLog` over the last 30 days; falls back to a curated list until there's real traffic |
| GET | `/categories` | Category tree with subcategories + live business counts |
| GET | `/cities` | Cities with live business counts |
| GET | `/cities/:citySlug/localities` | Localities within a city |
| GET | `/amenities` | Amenity list |
| GET | `/businesses/compare?slugs=a,b,c` | 2–3 businesses, full detail, sorted Elite → Premium → Basic |
| GET | `/businesses/:slug` | Full business detail; fires an async view-count increment |

`price` is `budget\|moderate\|premium\|luxury` (comma-separated for multiple), `tier` is `basic\|premium\|elite`, `sort` is `best_match\|distance\|rating\|reviews\|newest\|alphabetical`.

**Ranking** (`business.repository.ts`, `searchBusinesses`) is a single weighted-score SQL query, not client-side sorting — required for this to hold up past a few hundred rows. The score is `relevance + location_match + subscription_boost + verified + trusted + rating + reviews + completeness + popularity`, where:
- **Relevance** comes from `pg_trgm` similarity + ILIKE matches against name/category/keywords/services (0–100).
- **Location match** is pulled out of free text — e.g. "Gym Koramangala" is parsed into the keyword "Gym" plus a detected locality "Koramangala" (+80 for a locality match, +55 for a city match), *separately* from the relevance score.
- **Subscription boost is capped at +12 (Elite) / +6 (Premium)** — deliberately small relative to relevance (up to ~100) and location match (up to 80), so a well-matched Basic listing in the right city always outranks a poorly-matched Elite listing elsewhere. This is the exact rule from the brief ("a Basic Gym in Koramangala should rank above an Elite Gym in Delhi") and there's a live test case for it in `seed-mock-businesses.ts` ("Iron Paradise Fitness Club" vs "Elite Fitness Delhi").
- Non-relevance sorts (`rating`, `reviews`, `newest`) still use plan tier as a tie-breaker, per "if two businesses have equal relevance, Elite ranks above Premium."

This entire query depends on the `pg_trgm` extension from `npm run db:search-indexes` — without it, `/search` and `/search/suggestions` fail with a Postgres "function similarity() does not exist" error.

## Data acquisition — gmapsscraper.io

`scripts/gmaps-scraper/cli.ts` is a standalone tool for staging raw Google Maps leads via [gmapsscraper.io](https://gmapsscraper.io), separate from the app's runtime code. It never writes to the `Business` table — output lands in `scripts/gmaps-scraper/staging/businesses.csv` (gitignored, may contain PII) for a later, separate dedup/import step.

```bash
npm run scrape:gmaps -- --help
npm run scrape:gmaps -- --tier Low --city all --mode plain --max-credits 500 --dry-run
```

- Selection: `--subcategory`, `--sector`/`--tier` (combinable), or `--all-subcategories`, sourced from `scripts/gmaps-scraper/data/category-priority.json` (193 rows, generated from `Category_Priority.xlsx`; a 4th density tier, "Very Low", exists alongside High/Medium/Low).
- `--city` is `bangalore`/`chennai`/`mumbai`/`all`; `--location` is the free-text location appended to each query (defaults to the city name if omitted, i.e. city-level granularity).
- `--mode plain` (2 credits) or `--mode area` (10 credits) — **`area` mode's request shape is inferred from the published docs and hasn't been exercised against the live API yet** (the build's one verification call used `plain` mode). Confirm the response on the first real Area Search invocation before trusting it for a large run.
- `--max-credits` caps spend for that invocation; a persistent ledger (`scripts/gmaps-scraper/state/state.json`, gitignored) tracks cumulative spend and completed `subcategory+city+location+mode` combos across all runs, so re-running the same command is a no-op unless `--force` is passed.
- `place_id` (the intended dedup key) came back empty in testing; `cid` (Google's internal maps ID) was populated instead — the staging schema captures both plus a `dedup_key` column that prefers `place_id` and falls back to `cid`.
- Records missing name+address+phone are still staged, flagged `is_incomplete=true`. Nothing is filtered or deduped at this stage.

## Design notes

- Access tokens are short-lived JWTs (15 min default), returned in the response body — the frontend keeps them in memory only, never localStorage.
- Refresh tokens are opaque, hashed at rest, rotated on every use, and stored in an `httpOnly`/`secure`/`SameSite=Lax` cookie scoped to `/api/v1/auth`.
- Passwords hashed with bcrypt (12 rounds).
- RBAC via `requireAuth` + `requireRole(...)` middleware; roles are `user`, `business_owner`, `admin`, `super_admin`.
- Resetting a password revokes every existing refresh token for that user.
- Forgot-password / resend-verification always respond identically whether or not the account exists, to avoid leaking registered emails.
