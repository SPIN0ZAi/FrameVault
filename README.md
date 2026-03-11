<div align="center">

<img src="docs/screenshots/logo.png" alt="FrameVault Logo" width="100" />

<h1>FrameVault</h1>

<p><strong>A social film-tracking platform — discover, rate, review, and share every movie you watch.</strong></p>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-frame--vault--xi.vercel.app-00D1C1?style=for-the-badge)](https://frame-vault-xi.vercel.app)
&nbsp;
[![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
&nbsp;
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
&nbsp;
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## 📸 Screenshots

<table>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/screenshots/home-hero.png" alt="FrameVault Home Page" width="100%" />
      <br/><sub><b>Home Page</b> — rotating hero carousel with live ratings, Popular Right Now, and personalized recommendations</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/home-popular.png" alt="Popular and Picked For You" width="100%" />
      <br/><sub><b>Popular Right Now</b> live carousel &amp; <b>Picked For You</b> genre-based recs</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/home-trending.png" alt="Trending and Top Rated sections" width="100%" />
      <br/><sub><b>Trending This Week</b> &amp; <b>And the Oscar Goes to…</b> sections</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/movie-detail.png" alt="Movie Detail Page" width="100%" />
      <br/><sub><b>Movie Detail</b> — hero backdrop, cast, trailer, ratings histogram, reviews</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/profile.png" alt="User Profile" width="100%" />
      <br/><sub><b>Profile</b> — Top 5 Favorites, ratings histogram, stats bar</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/profile-films.png" alt="Films Tab" width="100%" />
      <br/><sub><b>Films Tab</b> — paginated watch history with sort &amp; rating filters</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/profile-reviews.png" alt="Reviews Tab" width="100%" />
      <br/><sub><b>Reviews Tab</b> — all written reviews with poster, rating &amp; edit controls</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/diary.png" alt="Film Diary" width="100%" />
      <br/><sub><b>Diary</b> — chronological film log grouped by month &amp; year</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/activity.png" alt="Activity Feed" width="100%" />
      <br/><sub><b>Activity Feed</b> — real-time stream of watches, ratings &amp; reviews from friends</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/screenshots/members.png" alt="Members Page" width="100%" />
      <br/><sub><b>Members</b> — discover film lovers sorted by popular · newest · most films</sub>
    </td>
  </tr>
</table>

---

## ✨ Features

<details open>
<summary><b>🎬 Discovery & Browsing</b></summary>

- **Hero Carousel** — rotating backdrop showcase of trending films with live TMDB ratings
- **Personalized "Picked For You"** — genre-weighted recommendations built from your highest-rated movies; automatically improves as you rate more films
- **Trending This Week** — live TMDB trending feed, refreshed on every request
- **And the Oscar Goes to…** — randomly sampled from TMDB's all-time top-rated films
- **Popular Right Now** — client-side live carousel that rotates every 30 seconds with a manual refresh button
- **Browse & Filter** — discover by genre, decade, and sort order; all filters sync to the URL so the browser back button always restores your exact page/position
- **Actor Pages** — click any cast member to view their full biography, birth info, and filmography grid

</details>

<details open>
<summary><b>👤 User Profiles</b></summary>

- **Top 5 Favorites** — pin your all-time favourites; prominently displayed on your profile
- **Top 5 Series** — pin your all-time favourite TV shows separately on your profile
- **Custom Posters (Letterboxd-style)** — upload your own poster or pick from TMDB alternatives for both movies and TV shows; propagates everywhere: profile, watchlist, activity feed, and favorites
- **Drag-to-reposition Banner & Avatar** — drag your banner and avatar images to crop exactly how you want; position is saved per-user
- **Films Tab** — paginated watched history with sort options (Latest · Oldest · Top Rated · A–Z) and rating filters; sort by rating is global across your full history, not just the current page
- **Reviews Tab** — all written reviews with inline star rating, poster, and edit/delete controls
- **Watchlist Tab** — movies saved to watch later
- **Lists Tab** — curated public or private film lists you've created
- **Network Tab** — followers and following with quick follow/unfollow
- **Ratings Histogram** — visual bar chart of your full rating distribution
- **Stats Bar** — films · ratings · reviews · watchlist · followers · following · avg rating

</details>

<details open>
<summary><b>📺 TV Shows</b></summary>

- Full TV show watchlist — track shows you want to watch
- Mark shows as watched with ratings
- Custom posters for TV shows — same upload flow as movies
- Top 5 Series — pin your favourite shows on your profile
- Show ratings displayed on profile stats

</details>

<details open>
<summary><b>⭐ Rating & Watching</b></summary>

- Rate movies 1–10 (displayed as ½–5 stars)
- "Mark as watched?" prompt appears after rating an unwatched film
- Auto-removes a movie from your watchlist when marked as watched
- Per-movie rating histogram visible on every film detail page
- Friends' ratings overlay on movie detail pages

</details>

<details open>
<summary><b>🎭 Social</b></summary>

- **Follow users** — personalised activity feed and home page tailored to who you follow
- **Activity Feed** — chronological stream of watches, ratings, and reviews from people you follow
- **Members Page** — discover members sorted by popular · newest · most films; search by username
- **Friends Activity** on each movie page — see which friends watched it and their ratings

</details>

<details open>
<summary><b> Authentication & Security</b></summary>

- **Forgot Password** — email-based password reset flow; cryptographically random tokens (SHA-256 hashed in DB), 1-hour expiry, single-use, anti-enumeration (always returns 200)
- **Password strength enforcement** — min 8 chars, uppercase, lowercase, number on all password fields
- **Rate limiting** — all sensitive endpoints protected via Upstash Redis sliding window: login (10/15m), register (5/1h), change-password (5/15m), forgot-password (5/1h), reset-password (5/15m), presign (20/10m)
- **Role-based access** — movie creation restricted to `owner` role
- **Input validation** — Zod schemas on all mutation endpoints

</details>

<details open>
<summary><b>📓 Diary</b></summary>

- Chronological film log grouped by year and month
- Navigate between years with prev/next arrows
- Star rating displayed per entry
- Click any entry to go straight to the movie page

</details>

<details open>
<summary><b>📋 Lists</b></summary>

- Create public or private curated film lists
- Add per-film notes and reorder entries
- Community lists showcased on the home page

</details>

<details open>
<summary><b>📤 Import / Export</b></summary>

- **Letterboxd CSV import** — import your full Letterboxd history (watched, ratings, reviews, watchlist) in a single upload
- **Data export** — download your complete FrameVault data from Settings at any time

</details>

<details open>
<summary><b>🛡️ Family-Friendly Content Filtering</b></summary>

- Multi-layer adult content filter applied to every TMDB endpoint
- Layer 1: TMDB's own `adult` flag
- Layer 2: whole-word keyword matching (40+ terms) + multi-word phrase blocklist checked against title and overview
- Minimum vote-count thresholds to suppress obscure low-quality content
- Applied to: trending, popular, top-rated, discover, similar movies, actor filmographies

</details>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) App Router · React 19 · TypeScript |
| **Database** | PostgreSQL via [Supabase](https://supabase.com) |
| **ORM** | [Prisma](https://www.prisma.io) |
| **Auth** | [NextAuth.js v5](https://authjs.dev) — credentials, JWT sessions, forgot/reset password |
| **Email** | [Nodemailer](https://nodemailer.com) via Gmail SMTP — transactional password reset emails |
| **Storage** | Supabase Storage (S3-compatible) for custom poster & banner uploads |
| **Movie Data** | [TMDB API](https://www.themoviedb.org/documentation/api) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com) — sliding window rate limiting on all auth endpoints |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Deployment** | [Vercel](https://vercel.com) — auto-deploy on push to `main` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database — free tier on [Supabase](https://supabase.com) works great
- A free [TMDB API Bearer token](https://www.themoviedb.org/settings/api)

### 1. Clone & install

```bash
git clone https://github.com/SPIN0ZAi/FrameVault.git
cd FrameVault
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# TMDB — use the v4 Bearer token (not the v3 API key string)
TMDB_API_KEY="eyJhbGciOiJIUzI1NiJ9..."

# Supabase Storage (for custom poster uploads)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email — Gmail SMTP (for forgot-password emails)
GMAIL_USER="youraddress@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"  # Google App Password (not your login password)

# Rate limiting (optional — feature is disabled if not set)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### 3. Database setup

```bash
npx prisma migrate dev     # creates all tables
npx prisma db seed         # seeds the genre list
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page (hero, sections, recs)
│   ├── movies/
│   │   ├── page.tsx                # Browse / discover (URL-persisted filters)
│   │   └── [id]/page.tsx           # Movie detail (ratings, cast, reviews)
│   ├── actors/[id]/page.tsx        # Actor bio + filmography
│   ├── users/[username]/page.tsx   # User profile (all tabs)
│   ├── diary/page.tsx              # Film diary by year/month
│   ├── activity/page.tsx           # Friends activity feed
│   ├── members/page.tsx            # Members directory
│   ├── lists/                      # List creation & viewing
│   ├── forgot-password/page.tsx    # Request password reset form
│   ├── reset-password/page.tsx     # Set new password (token from URL)
│   ├── settings/page.tsx           # Account settings & import/export
│   └── api/
│       ├── movies/                 # Movie CRUD · ratings · reviews · watched
│       ├── actors/[id]/            # Actor details + filmography from TMDB
│       ├── users/                  # Profiles · follow · watchlist · favorites
│       ├── recommendations/        # Genre-based personalized recommendations
│       ├── activity/               # Activity feed
│       ├── genres/                 # Genre list
│       └── auth/                   # NextAuth · register · change-password · forgot-password · reset-password
├── components/
│   ├── layout/                     # Header · Footer
│   ├── providers/                  # NextAuth + SWR providers
│   └── ui/
│       ├── HeroCarousel.tsx        # Home page hero carousel
│       ├── PopularSection.tsx      # Live "Popular Right Now" widget
│       ├── PersonalizedRecs.tsx    # "Picked For You" section
│       ├── ScrollRow.tsx           # Horizontal scroll container
│       └── ImageUploader.tsx       # Custom poster uploader
│   ├── lib/
│   │   ├── tmdb.ts                     # TMDB API client + adult content filter
│   │   ├── prisma.ts                   # Prisma singleton
│   │   ├── email.ts                    # Nodemailer Gmail SMTP helper
│   │   ├── auth/                       # NextAuth configuration + password utils
│   │   └── sync-movie.ts               # TMDB → local DB sync utility
└── types/
    └── next-auth.d.ts              # Session type augmentation
prisma/
├── schema.prisma                   # Full database schema
├── seed.ts                         # Genre seed
└── migrations/                     # Migration history
```

---

## 🌐 Deployment

The app auto-deploys to **Vercel** on every push to `main`.

```bash
npm run build    # type-check + build (also runs prisma generate)
```

Set all `.env` variables in your Vercel project under **Settings → Environment Variables**.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/SPIN0ZAi">SPIN0ZAi</a> &nbsp;·&nbsp; Powered by <a href="https://www.themoviedb.org">TMDB</a></sub>
</div>


