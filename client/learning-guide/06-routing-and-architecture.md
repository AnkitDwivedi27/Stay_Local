# Phase 5: Routing & Application Architecture in StayLocal

> **Scope:** Client-side routing with React Router v6, layout nesting, dynamic URL parameters, query strings, and navigation lifecycle in StayLocal.  
> **Target Mastery:** Level 1 (Essential) & Level 2 (Intermediate)

---

## Concept 1: Declarative Client-Side Routing with React Router v6

### 1. Concept Name
Client-Side Single Page Application (SPA) Routing

### 2. Why It Exists
In traditional multi-page websites, clicking a link requests a brand new HTML page from the server, causing a full browser reload, blank white flash, and loss of client-side state. In a Single Page Application, React Router intercepts link clicks in the browser, prevents page reload, and dynamically swaps out component trees based on the URL.

### 3. How It Works
- `<BrowserRouter>` wraps the app, listening to the HTML5 History API (`window.history.pushState`).
- `<Routes>` inspects the current `window.location.pathname` and renders the best-matching child `<Route>`.
- `<Route path="..." element={<Component />} />` maps a URL path pattern to a specific React component.

### 4. StayLocal Implementation
- **File Reference:** [client/src/App.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/App.tsx#L28-L40)
- **Component:** `App`

### 5. Actual Code Example
```typescript
// client/src/App.tsx
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="destinations" element={<DestinationsPage />} />
          <Route path="destinations/:id" element={<DestinationDetailPage />} />
          <Route path="stays" element={<StaysPage />} />
          <Route path="stays/:id" element={<StayDetailPage />} />
```

### 6. Line-by-Line Explanation
- **Line 4:** `<Routes>` defines the root routing switchboard.
- **Line 5:** `<Route path="/" element={<RootLayout />}>` defines the top-level parent layout route.
- **Line 6:** `<Route index element={<HomePage />} />` specifies that when the user visits the root `/`, the index view is `HomePage`.
- **Line 7:** Nested relative path `"destinations"` matches `/destinations`.

### 7. Execution Flow
1. User types `http://localhost:5173/destinations` or clicks a navigation link.
2. React Router prevents browser reload.
3. React Router matches `path="destinations"`.
4. `RootLayout` renders, and `DestinationsPage` is projected inside its `<Outlet />`.

### 8. Interview Questions
1. *How does client-side routing work without refreshing the page? What browser API makes it possible?*
2. *What is the difference between `<BrowserRouter>` and `<HashRouter>`?*
3. *What is an "index route" in React Router v6?*

### 9. Practical Exercise
Add a new public route `/contact` inside `App.tsx` that renders a simple contact component, and verify that navigating to `/contact` renders the component inside `RootLayout`.

### 10. Prerequisites
HTML URLs, paths, and React components.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.0 hours

---

## Concept 2: Layout Routes & Content Projection with `<Outlet />`

### 1. Concept Name
Layout Routes and the `<Outlet />` Component

### 2. Why It Exists
Websites share common UI chrome across multiple pages (e.g., universal Header, top navigation bar, footer, and background themes). Re-rendering the Header and Footer inside every single page component creates code duplication and causes the header to unmount and remount on every navigation. Layout routes establish a persistent parent shell, projecting whatever child page matches the URL into `<Outlet />`.

### 3. How It Works
- The parent route renders the shared shell: `<Header />`, `<main><Outlet /></main>`, `<Footer />`.
- `<Outlet />` acts as a dynamic placeholder (a "hole" in the template).
- When a child route matches (e.g., `/stays`), React Router mounts `StaysPage` directly inside `<Outlet />`, while `Header` and `Footer` remain completely undisturbed.

### 4. StayLocal Implementation
- **File Reference:** [client/src/layouts/RootLayout.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/layouts/RootLayout.tsx#L7-L23)
- **Component:** `RootLayout`

### 5. Actual Code Example
```typescript
// client/src/layouts/RootLayout.tsx
export const RootLayout: React.FC = () => {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-himalayan-atmosphere text-charcoal-800">
      <Header onOpenExplainer={() => setExplainerOpen(true)} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <VerificationExplainerModal
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};
```

### 6. Line-by-Line Explanation
- **Line 7:** `<Header />` renders at the top of every page in the application.
- **Line 9:** `<Outlet />` renders the specific matched child route (e.g., `HomePage`, `StaysPage`, `StayDetailPage`).
- **Line 11:** `<Footer />` renders persistently at the bottom.
- **Line 12:** `VerificationExplainerModal` is mounted at the root level, allowing any page or header button to open it.

### 7. Execution Flow
1. User navigates from `/destinations` to `/stays`.
2. `RootLayout`, `Header`, and `Footer` do NOT unmount or re-render.
3. Only the component inside `<Outlet />` transitions from `DestinationsPage` to `StaysPage`.

### 8. Interview Questions
1. *What is `<Outlet />` in React Router v6, and how does it compare to `props.children`?*
2. *Can layout routes be nested multiple levels deep?*
3. *What are the performance advantages of using layout routes over importing Header/Footer on every page?*

### 9. Practical Exercise
Inspect [client/src/layouts/RootLayout.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/layouts/RootLayout.tsx). Notice the `bg-himalayan-atmosphere` background class applied to the outer div. Explain why applying this on `RootLayout` ensures all 18 pages share the same Himalayan texture.

### 10. Prerequisites
React Router basics and component composition.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 3: Dynamic Route Parameters (`useParams`)

### 1. Concept Name
Dynamic Route Parameters (`:param`) and the `useParams` Hook

### 2. Why It Exists
Applications cannot create hardcoded routes for thousands of individual database records (e.g., `/stays/stay-mun-01`, `/stays/stay-mun-02`, etc.). Dynamic segment patterns like `/stays/:id` match any variable value at that path position. `useParams` extracts the matched parameter from the URL.

### 3. How It Works
- Path pattern: `<Route path="stays/:id" element={<StayDetailPage />} />`.
- When the user visits `/stays/stay-bhm-01`, React Router captures `{ id: 'stay-bhm-01' }`.
- Inside `StayDetailPage`, calling `const { id } = useParams<{ id: string }>();` returns the captured ID.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/StayDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StayDetailPage.tsx#L21)
- **Component:** `StayDetailPage`

### 5. Actual Code Example
```typescript
// client/src/pages/StayDetailPage.tsx
export const StayDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stay, setStay] = useState<AccommodationRecord | null>(null);
```

### 6. Line-by-Line Explanation
- **Line 2:** `useParams<{ id: string }>()` reads the `:id` portion of the current URL string.
- This `id` is subsequently passed to `apiService.getStayById(id)` to load the specific homestay.

### 7. Execution Flow
1. User clicks on a homestay card pointing to `/stays/stay-mun-02`.
2. Router matches pattern `stays/:id`.
3. `StayDetailPage` mounts; `useParams` returns `{ id: 'stay-mun-02' }`.
4. `useEffect` detects `id` and fetches the record from the database.

### 8. Interview Questions
1. *What happens if a user navigates to `/stays/` without providing an `:id` parameter?*
2. *Can a single route have multiple dynamic parameters (e.g., `/destinations/:destId/stays/:stayId`)?*
3. *What is the type of a value returned by `useParams` if no generic is provided?*

### 9. Practical Exercise
Inspect [client/src/pages/DestinationDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/DestinationDetailPage.tsx#L21). Trace how `id` is extracted and what happens if `apiService.getDestinationById(id)` returns `null`.

### 10. Prerequisites
URL paths, routing, and generic TypeScript types.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 1.5 hours

---

## Concept 4: Query String Synchronization (`useSearchParams`)

### 1. Concept Name
URL Query Parameter Management (`useSearchParams`)

### 2. Why It Exists
Search filters, sorting choices, and pagination state should be **shareable and bookmarkable**. If a user filters by `destination=Munsiyari&category=village_homestay` and bookmarks the URL, refreshing the page should restore those exact same filter settings. Storing filters solely in memory loses them on refresh. `useSearchParams` synchronizes React state with the URL query string.

### 3. How It Works
- `const [searchParams, setSearchParams] = useSearchParams();`
- Works identically to `useState`, but persists the state directly in the browser's URL query string (`?key=value`).
- Reading values: `searchParams.get('destination')`.
- Setting values: `setSearchParams({ destination: 'munsiyari' })`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/StaysPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StaysPage.tsx#L13-L18)
- **Component:** `StaysPage` — initializing search filters from URL parameters.

### 5. Actual Code Example
```typescript
// client/src/pages/StaysPage.tsx
export const StaysPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlDestination = searchParams.get('destination') || '';
  const urlDistrict = searchParams.get('district') || '';

  const [destinationFilter, setDestinationFilter] = useState(urlDestination);
```

### 6. Line-by-Line Explanation
- **Line 2:** `useSearchParams()` reads the active URL query parameters.
- **Lines 3–4:** Extracts `destination` and `district` query parameters passed from the Home page search bar (`/stays?destination=Munsiyari`).
- **Line 6:** Seeds the local `destinationFilter` state with the value extracted from the URL.

### 7. Execution Flow
1. On the Home page, user searches for "Munsiyari" and clicks Search.
2. Home page navigates to `/stays?destination=Munsiyari`.
3. `StaysPage` mounts; `searchParams.get('destination')` returns `'Munsiyari'`.
4. `destinationFilter` is pre-populated with `'Munsiyari'`, and the catalog immediately displays Munsiyari homestays.

### 8. Interview Questions
1. *What is the difference between route parameters (`/stays/:id`) and query parameters (`/stays?id=...`)?*
2. *Why is it important to store search filters in URL query parameters rather than local component state alone?*
3. *Does updating query parameters with `setSearchParams` cause a page reload?*

### 9. Practical Exercise
Look at [client/src/pages/HomePage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HomePage.tsx#L54-L60). Notice how `handleHeroSearch` constructs `params` using `new URLSearchParams()` and calls `navigate('/stays?' + params.toString())`.

### 10. Prerequisites
Query strings and `useState`.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 5: Programmatic Navigation & History State (`useNavigate`, `useLocation`)

### 1. Concept Name
Programmatic Navigation & Location State

### 2. Why It Exists
Users don't only navigate by clicking `<Link>` tags; navigation often needs to happen **in response to code events** (e.g., redirecting to the dashboard after a successful login, or redirecting to the 404 page when a record isn't found). Furthermore, when redirecting an unauthenticated user to `/login`, the application must remember which page they were trying to visit so it can send them back there after they log in.

### 3. How It Works
- `const navigate = useNavigate();` — allows pushing or replacing history entries imperatively: `navigate('/profile', { replace: true })`.
- `const location = useLocation();` — gives access to the current URL object and any custom `location.state` passed during navigation.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/LoginPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/LoginPage.tsx#L8-L16) and [client/src/components/auth/ProtectedRoute.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/auth/ProtectedRoute.tsx#L30)
- **Component:** `LoginPage` and `ProtectedRoute`

### 5. Actual Code Example
```typescript
// client/src/components/auth/ProtectedRoute.tsx
if (!isAuthenticated || !user) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}

// client/src/pages/LoginPage.tsx
const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';
// After successful login:
navigate(from, { replace: true });
```

### 6. Line-by-Line Explanation
- **Line 2 (`ProtectedRoute`):** If unauthenticated, `<Navigate>` forwards the user to `/login`, attaching their current location `{ from: location }` in navigation state.
- **Line 5 (`LoginPage`):** Unpacks `location.state.from.pathname`. If present, stores where the user was heading; otherwise defaults to `'/profile'`.
- **Line 7 (`LoginPage`):** Upon login success, `navigate(from, { replace: true })` routes the user directly back to their intended destination and replaces the login entry in history.

### 7. Execution Flow
1. Tourist tries to access `/bookings` while logged out.
2. `ProtectedRoute` intercepts the request, notes `location.pathname === '/bookings'`, and redirects to `/login`.
3. Tourist signs in with email/password.
4. `LoginPage` inspects `location.state` and sends them straight to `/bookings`.

### 8. Interview Questions
1. *What does the `{ replace: true }` option do in `navigate()`? Why is it crucial after a login redirect?*
2. *Where is `location.state` stored, and does it persist across hard page refreshes?*
3. *What is the difference between `<Link to="...">` and `navigate("...")`?*

### 9. Practical Exercise
Trace what happens in the browser history if you log in with `replace: false` versus `replace: true`, and explain why pressing the browser's "Back" button after logging in with `replace: false` creates an annoying redirect loop.

### 10. Prerequisites
React Router basics and authentication concepts.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours
