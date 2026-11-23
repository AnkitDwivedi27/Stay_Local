# Phase 12: Testing, Tooling & Production Deployment in StayLocal

> **Scope:** Vitest runner configuration, React Testing Library (RTL) patterns, in-memory routing, API mocking, Vite build pipeline, and Netlify edge deployment in StayLocal.  
> **Target Mastery:** Level 2 (Intermediate) & Level 3 (Advanced)

---

## Concept 1: Component Testing with Vitest and React Testing Library (RTL)

### 1. Concept Name
User-Centric Component Testing with RTL & Vitest

### 2. Why It Exists
Historically, developers tested React components by inspecting internal state or implementation details (e.g. testing `wrapper.state('loading') === true` using Enzyme). When the component was refactored without changing behavior, all tests broke. React Testing Library enforces **User-Centric Testing**: testing components the way real humans interact with them (e.g. finding buttons by their accessible text and asserting what appears on the screen).

### 3. How It Works
- **Vitest:** The high-speed test runner that shares the exact same configuration, plugins, and transforms as Vite.
- **`render(<Component />)`:** Mounts the component into a virtual JSDOM environment.
- **`screen.getByText()` / `screen.getByRole()`:** Queries the DOM using accessible roles and user-visible strings.
- **`fireEvent.click()`:** Simulates real user interactions (typing, clicking, submitting).
- **`expect().toBeInTheDocument()`:** Jest-DOM assertion verifying the presence of elements.

### 4. StayLocal Implementation
- **File Reference:** [client/src/test/booking.test.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/test/booking.test.tsx#L85-L125)
- **Test File:** `booking.test.tsx` — verifying the `BookingModal`.

### 5. Actual Code Example
```typescript
// client/src/test/booking.test.tsx
describe('BookingModal Component', () => {
  it('renders verified homestay details and calculates live price breakdown with community fee', () => {
    render(
      <MemoryRouter>
        <BookingModal
          stay={mockVerifiedStay}
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Mesar Kund Alpine Homestay/i)).toBeInTheDocument();
    expect(screen.getByText(/Village Homestay/i)).toBeInTheDocument();
    expect(screen.getByText(/StayLocal Community Fund/i)).toBeInTheDocument();
  });
});
```

### 6. Line-by-Line Explanation
- **Line 2:** `it(...)` defines an isolated test case.
- **Line 3:** `render(<MemoryRouter><BookingModal ... /></MemoryRouter>)` renders the modal inside an in-memory router wrapper so any internal navigation calls don't crash.
- **Line 13:** `screen.getByText(/Mesar Kund Alpine Homestay/i)` searches the rendered DOM for the property name.
- **Line 15:** Asserts that the 5% Community Fund fee calculation appears in the pricing breakdown.

### 7. Execution Flow
1. Developer runs `npm run test:client`.
2. Vitest spins up JSDOM (browser-like DOM environment in Node.js).
3. The component executes its render cycle.
4. RTL verifies the accessibility tree and assertions.
5. All 29 tests pass with sub-second execution speed.

### 8. Interview Questions
1. *What is the guiding philosophy of React Testing Library: "The more your tests resemble the way your software is used..."?*
2. *What is the difference between `getBy...`, `queryBy...`, and `findBy...` queries in RTL?*
3. *Why is `screen.getByRole('button', { name: /save/i })` preferred over `screen.getByText('Save')`?*

### 9. Practical Exercise
Inspect [client/src/test/auth.test.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/test/auth.test.tsx#L20-L50). Notice how `fireEvent.change` simulates typing into the email and password inputs of `LoginPage`.

### 10. Prerequisites
Unit testing fundamentals and DOM manipulation.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 3.0 hours

---

## Concept 2: Mocking API Services & Authentication (`vi.spyOn`, `vi.mock`)

### 1. Concept Name
Service Layer Mocking & Spying

### 2. Why It Exists
Unit and integration tests must run **deterministically, offline, and in milliseconds**. If frontend tests made real network requests to the production backend on Render, tests would fail whenever the network dropped, execute slowly, and pollute the database with dummy test records. Mocking replaces the network service with simulated responses.

### 3. How It Works
- `vi.spyOn(apiService, 'getMyBookings').mockResolvedValue(mockBookingData);`
- When the component calls `apiService.getMyBookings()`, Vitest intercepts the call and immediately returns the mock data without touching the network.
- `expect(apiService.getMyBookings).toHaveBeenCalledTimes(1);` verifies that the component triggered the fetch.

### 4. StayLocal Implementation
- **File Reference:** [client/src/test/booking.test.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/test/booking.test.tsx#L70-L80)
- **Test File:** `booking.test.tsx`

### 5. Actual Code Example
```typescript
// client/src/test/booking.test.tsx
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(apiService, 'getMyBookings').mockResolvedValue([mockBooking]);
  vi.spyOn(apiService, 'getTouristGuideBookings').mockResolvedValue([]);
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: mockTouristUser,
    loading: false,
    error: null,
    isAuthenticated: true,
    role: 'tourist',
    isHost: false,
    isGuide: false,
    isAdmin: false,
    isTourist: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  });
});
```

### 6. Line-by-Line Explanation
- **Line 2:** `vi.clearAllMocks()` resets call counts and spy states before every single test.
- **Line 3:** `mockResolvedValue([mockBooking])` mocks the API response with our fixture data.
- **Lines 5–18:** Mocks `useAuth()` to simulate a logged-in Tourist without needing to go through a real login form.

### 7. Execution Flow
1. Test begins.
2. `MyBookingsPage` mounts.
3. Component calls `apiService.getMyBookings()`.
4. The spy intercepts the call and resolves immediately with `[mockBooking]`.
5. The bookings table renders the mock reservation reference (`SLB-7K9F2Q`).

### 8. Interview Questions
1. *What is the difference between a stub, a mock, and a spy in software testing?*
2. *Why should you call `vi.clearAllMocks()` in `beforeEach`?*
3. *How do you simulate an API network failure in a test using `mockRejectedValue`?*

### 9. Practical Exercise
Look at [client/src/test/host-admin.test.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/test/host-admin.test.tsx). Identify how `apiService.getHostListings` is mocked to return two listings with verified and draft publication states.

### 10. Prerequisites
Promises, closures, and Vitest test structure.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.5 hours

---

## Concept 3: Vite Production Build & Asset Chunking

### 1. Concept Name
Vite Build Optimization & Rollup Chunking

### 2. Why It Exists
Browsers cannot run raw TypeScript (`.tsx`) files or process hundreds of modular imports in production without catastrophic latency. Vite's production build runs TypeScript type checks (`tsc`) and bundles, minifies, tree-shakes, and compresses code using Rollup into a hyper-optimized set of static HTML, CSS, and JS chunks.

### 3. How It Works
- Command: `npm run build:client` -> executes `tsc && vite build`.
- **Step 1 (Typecheck):** `tsc` verifies that zero type errors exist across all source files.
- **Step 2 (Bundle):** Vite parses `index.html`, traces all imports from `main.tsx`, treeshakes unused code, and generates hashed assets in `client/dist/`:
  - `dist/index.html` (1.16 kB)
  - `dist/assets/index-BjS40DbN.css` (63.85 kB)
  - `dist/assets/index-B-WWsgsk.js` (683.60 kB)
- **Step 3 (Content Hashing):** The asset filenames include a cryptographic content hash (`-B-WWsgsk.js`). This enables **permanent browser caching** (`Cache-Control: max-age=31536000, immutable`): browsers never re-download an unchanged asset, but instantly download new files when code changes.

### 4. StayLocal Implementation
- **File Reference:** [client/vite.config.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/vite.config.ts) and [client/package.json](file:///c:/Users/HP/Downloads/Major%20Project/client/package.json#L9)
- **Configuration:** Vite production bundler.

### 5. Actual Code Example
```typescript
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### 6. Line-by-Line Explanation
- **Line 5:** Injects the Fast Refresh React plugin for instant HMR during development.
- **Lines 6–12:** Configures a local proxy forwarding `/api` to the Express backend on port 5000 during local development.
- **Lines 13–17:** Configures Vitest with JSDOM and sets up `@testing-library/jest-dom` extensions.

### 7. Execution Flow
1. Developer runs `npm run build:client`.
2. `tsc` confirms 100% type safety.
3. Vite transforms 1,636 modules in ~5 seconds.
4. Output directory `client/dist` is populated with static assets ready for edge deployment.

### 8. Interview Questions
1. *Why does the build script run `tsc && vite build` instead of just `vite build`? (Hint: Vite transpiles TypeScript without type-checking!)*
2. *What is tree-shaking, and how do ES6 static imports enable it?*
3. *Why do production asset filenames include random-looking hashes like `index-BjS40DbN.css`?*

### 9. Practical Exercise
Inspect the output of `npm run build:client`. Notice the warning: *"Some chunks are larger than 500 kB after minification."* Explain how dynamic code splitting with `React.lazy()` and `import()` can split the Admin portal into a separate chunk.

### 10. Prerequisites
Vite, npm scripts, and web asset bundling.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 2.0 hours
