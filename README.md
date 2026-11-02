# StayLocal — Community-Led Tourism & Homestay Platform (Uttarakhand, India)

StayLocal is a production-oriented tourism and homestay discovery and booking platform built with the MERN stack (MongoDB Atlas, Express.js, React, Node.js) and TypeScript.

The platform directly bridges conscious travelers with village homestays, living Himalayan heritage, and traditional artisan crafts across Uttarakhand (Pithoragarh, Nainital, Bageshwar, and the Johar Valley) without third-party commission markups.

---

## 1. Architecture & Monorepo Structure

The project is structured as an npm workspaces monorepo:

```text
StayLocal/
├── client/                               # React 18 + Vite 5 + TypeScript Frontend
│   ├── public/
│   │   ├── _redirects                    # SPA redirect configuration for Netlify/Cloudflare
│   │   └── favicon.svg                   # Himalayan peak brand icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                     # ProtectedRoute with RBAC guards
│   │   │   ├── booking/                  # BookingModal with server price calculation
│   │   │   ├── common/                   # Header (role-aware navigation), Footer
│   │   │   ├── destinations/             # DestinationCard, DestinationFilterBar
│   │   │   ├── experiences/              # ExperienceCard, ExperienceFilterBar
│   │   │   ├── host/                     # ListingFormModal (create & edit homestays)
│   │   │   ├── stays/                    # StayCard, StayFilterBar
│   │   │   └── ui/                       # Badge, Button, Card, ErrorMessage, Input, Select, Modal
│   │   ├── context/                      # AuthContext (session, login, register, logout)
│   │   ├── data/                         # Curated research datasets (Destinations, Stays, Crafts)
│   │   ├── layouts/                      # RootLayout with persistent navigation and modal
│   │   ├── pages/                        # Home, Destinations, DestinationDetail, Stays, StayDetail,
│   │   │                                 # Experiences, ExperienceDetail, About, Login, Register, Profile,
│   │   │                                 # MyBookings, HostBookings, HostListings, AdminVerification, NotFound
│   │   ├── services/                     # Typed REST API client with cookie credentials & offline fallback
│   │   ├── test/                         # Unit & integration tests (Vitest + RTL + Happy-DOM)
│   │   ├── types/                        # Strict domain TypeScript interfaces
│   │   ├── App.tsx                       # Complete React Router setup
│   │   └── index.css                     # Tailwind CSS and Himalayan brand tokens
│   ├── vercel.json                       # Vercel SPA rewrite configuration
│   └── vite.config.ts                    # Vite build configuration (proxy to :5000, ESNext target)
├── server/                               # Node.js + Express.js + Mongoose + TypeScript Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                     # Mongoose connection manager & health status
│   │   │   └── env.ts                    # Zod-validated environment configuration
│   │   ├── controllers/                  # Auth, Booking, HostListing, AdminListing, Health, Stays...
│   │   ├── middleware/                   # JWT Auth, RBAC guards, Rate Limiter, Error Handler, 404 Handler
│   │   ├── models/                       # User, Stay, Booking, Destination, Experience
│   │   ├── routes/                       # Modular Express routers
│   │   ├── scripts/                      # Idempotent database seed script (with --dry-run)
│   │   ├── services/                     # Auth, Booking (concurrency locks), HostListing, AdminListing...
│   │   ├── types/                        # Domain interfaces and API contract types
│   │   ├── utils/                        # AppError, token utilities, slugify
│   │   ├── validators/                   # Zod request body & query schemas
│   │   ├── app.ts                        # Express application instance with optional static frontend serving
│   │   └── server.ts                     # HTTP listener, bootstrap, and graceful shutdown (SIGTERM/SIGINT)
│   └── tests/                            # Vitest + Supertest integration test suites
├── .env.example                          # Root environment template
├── .gitignore                            # Comprehensive ignore list
├── package.json                          # Monorepo workspaces configuration & scripts
└── README.md                             # Project documentation
```

---

## 2. Technology Stack & Key Decisions

### Frontend
- **React 18** with **Vite 5**: Fast development HMR and optimized production bundles.
- **TypeScript 5 (Strict Mode)**: Comprehensive static type safety across components, hooks, and API client.
- **React Router 6**: Declarative routing with client-side RBAC protection (`tourist`, `host`, `admin`).
- **Tailwind CSS 3**: Custom Himalayan palette (Forest Green `#1E3A2F`, Warm Clay `#C06C4E`, Mountain Slate `#4A6B82`, Sand `#FBF9F5`, Charcoal `#1B221E`).
- **Lucide React**: Mountain, heritage, and verification icons.
- **Vitest & React Testing Library (Happy-DOM)**: 29 client-side tests covering routing, auth forms, booking calculations, host dashboards, and detail views.

### Backend
- **Node.js 20 LTS** with **Express 4**.
- **TypeScript 5 (Strict Mode)**: Strict null checks and type validation.
- **Mongoose 8** with **MongoDB Atlas**: Production persistence with compound indexes.
- **Zod 3**: Strict runtime validation of environment variables, query parameters, and request payloads.
- **Security & RBAC**:
  - Passwords hashed with **bcryptjs** (salt factor 12).
  - JWT tokens stored in **HttpOnly, SameSite, Secure** cookies.
  - Role-based authorization: `tourist`, `host`, `guide`, `admin`.
  - Rate limiting on sensitive authentication endpoints (`express-rate-limit`).
  - Strict host ownership isolation (hosts can only view/edit their own listings and booking requests).
  - Atomic confirmation lock on homestays (`confirmationLock`, `confirmationLockExpiresAt`) serializing concurrent booking confirmations.
- **Testing**: Vitest + Supertest with 91 backend tests covering health, auth, RBAC, booking lifecycle, listing management, admin verification, and database error states.

---

## 3. Core User Journeys

### A. Tourist Journey
1. **Public Discovery**: Browse Uttarakhand destinations, village homestays, and cultural experiences. Filter by district, category, verification badge, and guest count.
2. **Individual Detail Pages**: View dedicated pages for stays (`/stays/:id`), destinations (`/destinations/:id`), and experiences (`/experiences/:id`) with high-res photos, amenities, village specialties, and responsible travel guidelines.
3. **Transparent Verification**: Unverified field leads are clearly distinguished from verified homestays. Direct bookings are unlocked only for verified stays.
4. **Booking Request**: Select dates and guest counts. View an authoritative server-calculated price breakdown (nightly rate + 5% village conservation fee + 5% sustainable tourism tax).
5. **My Bookings (`/bookings`)**: Review booking requests, status badges (`pending`, `confirmed`, `rejected`, `cancelled`, `completed`), and cancel eligible reservations.

### B. Host Journey
1. **Registration & Onboarding**: Register as a host (`role: 'host'`).
2. **Listing Management (`/host/listings`)**:
   - Create new listings with photos, room counts, amenities, and local specialties.
   - Edit owned homestays. Server prevents reducing guest capacity below active confirmed reservations.
   - Deactivate or unlist homestays without corrupting existing reservations.
3. **Verification Submission**: Submit listing to administrator verification queue with operator credentials and registration notes.
4. **Host Bookings (`/host/bookings`)**: View booking requests for owned stays. Confirm or decline requests with optional host notes. Dates for confirmed bookings are locked atomically.

### C. Administrator Journey
1. **Admin Verification Queue (`/admin/verification`)**: View pending listings filtered by status and district. Inspect full evidence, operator profile, and audit trail.
2. **Approval & Rejection**: Approve listings (transitions to `verified`, unlocks public discovery and tourist bookings) or reject with explanatory feedback for the host.
3. **Listing Suspension**: Suspend listings violating platform standards with a mandatory reason. Deactivates listing immediately and prevents new bookings or confirmations.

---

## 4. Environment Variables

Create `.env` (or `server/.env` and `client/.env`) from `.env.example`:

### Backend Configuration (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Application runtime environment | `development` (use `production` in deployment) |
| `PORT` | Backend server port | `5000` |
| `CORS_ORIGIN` | Allowed client origin for CORS and cookies | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens (>= 32 chars) | `your-secure-random-jwt-secret-at-least-32-chars-long` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |

### Frontend Configuration (`client/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of backend REST API | `http://localhost:5000/api` (or `/api` with proxy) |

---

## 5. Local Development Instructions

The repository includes embedded Node.js tooling in `.tools/nodejs` for Windows PowerShell environments.

### Step 1: Clone and Set Up Environment
```powershell
# Open Windows PowerShell in project root
$env:PATH = "$PWD\.tools\nodejs;$env:PATH"

# Copy environment template
Copy-Item .env.example .env
Copy-Item .env.example server\.env
Copy-Item client\.env.example client\.env
```

### Step 2: Seed the Database (Optional if MongoDB Atlas is configured)
```powershell
$env:PATH = "$PWD\.tools\nodejs;$env:PATH"

# Preview records without writing (Dry-run)
npm run db:seed:dry

# Import curated Uttarakhand destinations, stays, and experiences
npm run db:seed
```

### Step 3: Run the Application
```powershell
$env:PATH = "$PWD\.tools\nodejs;$env:PATH"

# Start backend (:5000) and frontend (:5173) concurrently
npm run dev
```

Alternatively, run in separate terminals:
```powershell
# Terminal 1: Backend API
$env:PATH = "$PWD\.tools\nodejs;$env:PATH"
npm run dev:server

# Terminal 2: Frontend Client
$env:PATH = "$PWD\.tools\nodejs;$env:PATH"
npm run dev:client
```

* **Frontend URL**: `http://localhost:5173`
* **Backend Health**: `http://localhost:5000/api/health`
* **Backend Readiness**: `http://localhost:5000/api/health/ready`

---

## 6. Testing & Quality Verification

Run all workspace checks:

```powershell
$env:PATH = "$PWD\.tools\nodejs;$env:PATH"

# 1. TypeScript checks
npm run typecheck:client
npm run typecheck:server

# 2. Workspace ESLint
npm run lint

# 3. Client unit and integration tests (29 tests)
npm --prefix client test

# 4. Server API and RBAC tests (91 tests)
npm --prefix server test

# 5. Production builds
npm run build:server
npm run build:client
```

---

## 7. Deployment Instructions

### Architecture Option 1: Split Deployment (Recommended)
* **Frontend**: Deploy `client/` to Vercel, Netlify, or Cloudflare Pages.
  * Build Command: `npm run build`
  * Output Directory: `dist`
  * Set Environment Variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api`
  * Direct SPA routing is handled by `_redirects` and `vercel.json`.
* **Backend**: Deploy `server/` to Render, Railway, Fly.io, or AWS ECS.
  * Build Command: `npm run build`
  * Start Command: `node dist/server.js`
  * Set Environment Variables: `NODE_ENV=production`, `PORT=5000`, `MONGODB_URI=...`, `JWT_SECRET=...`, `CORS_ORIGIN=https://yourfrontend.com`
* **Database**: MongoDB Atlas Cluster:
  * Network Access: Add deployment server IPs to the IP Access List (or `0.0.0.0/0` with strong password authentication).
  * Run idempotent seed: `npm run seed` once to initialize curated regional records.

### Architecture Option 2: Unified Container Deployment
Express in `server/src/app.ts` is configured to serve `client/dist` static assets and route all non-API paths to `index.html` when `client/dist` exists.
1. Run `npm run build` from monorepo root.
2. Run `npm run start --workspace=server`.
3. The server serves both the REST API on `/api/*` and the React frontend on all other routes.

---

## 8. Responsible Tourism Charter

StayLocal adheres to the **Uttarakhand Responsible Tourism Charter**:
* **Direct Revenue**: 100% of accommodation tariffs are retained by village host families.
* **Community Conservation Fund**: A 5% community contribution is calculated on reservations for local Van Panchayats to support forest fire management and alpine meadow conservation.
* **Integrity**: Unverified research leads are segregated and cannot accept bookings. No artificial reviews or fabricated ratings are published.
