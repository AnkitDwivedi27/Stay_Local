# Phase 4: React Hooks & Advanced Patterns in StayLocal

> **Scope:** Advanced lifecycle management, memoization boundaries, custom hooks, and reactive side-effects in StayLocal.  
> **Target Mastery:** Level 1 (Essential) & Level 2 (Intermediate)

---

## Concept 1: The `useEffect` Hook & Lifecycle Management

### 1. Concept Name
Side-Effect Management (`useEffect`)

### 2. Why It Exists
React rendering must be a **pure calculation**: computing JSX based purely on props and state without triggering network calls, subscribing to events, or altering the browser DOM directly during render. `useEffect` provides an escape hatch to perform side effects *after* the browser has painted the screen.

### 3. How It Works
- `useEffect(effectFunction, dependencyArray);`
- **Mount (Empty array `[]`):** Runs once after the component mounts to the DOM.
- **Update with Dependencies (`[id, filters]`):** Runs after render *only* if at least one dependency value has changed since the previous render (using `Object.is` reference equality).
- **No Dependency Array:** Runs after *every* render (rarely intended; can cause performance bottlenecks).

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/StaysPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StaysPage.tsx#L57-L59)
- **Component:** `StaysPage` — triggering data re-fetching when filters change.

### 5. Actual Code Example
```typescript
// client/src/pages/StaysPage.tsx
const loadStays = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await apiService.getStays({
      destination: destinationFilter,
      district: urlDistrict,
      category: categoryFilter,
      verificationStatus: verificationFilter,
      minGuests: minGuests > 0 ? minGuests : undefined,
    });
    setStays(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to retrieve listings.');
  } finally {
    setLoading(false);
  }
}, [destinationFilter, urlDistrict, categoryFilter, verificationFilter, minGuests]);

useEffect(() => {
  loadStays();
}, [loadStays]);
```

### 6. Line-by-Line Explanation
- **Lines 1–17:** `loadStays` is wrapped in `useCallback` with its query dependencies.
- **Line 19:** `useEffect` lists `[loadStays]` in its dependency array. Whenever a filter changes, `loadStays` is re-created with the new query values, causing `useEffect` to trigger and fetch matching homestays.

### 7. Execution Flow
1. User selects "Village Homestay" in the filter dropdown.
2. `setCategoryFilter('village_homestay')` updates state.
3. Component re-renders.
4. React detects `categoryFilter` changed, so `useCallback` returns a new `loadStays` function reference.
5. React runs `useEffect`, invoking the new `loadStays()` and populating the updated homestays.

### 8. Interview Questions
1. *What causes an infinite loop in `useEffect`?*
2. *Why should functions called inside `useEffect` be wrapped in `useCallback` or declared inside the effect?*
3. *What is the difference between `useEffect` and `useLayoutEffect`?*

### 9. Practical Exercise
Inspect [client/src/pages/DestinationDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/DestinationDetailPage.tsx#L40-L42). Explain why `[fetchDestination]` is listed as a dependency in `useEffect`.

### 10. Prerequisites
React state, component re-renders, and JavaScript asynchronous execution.  
**Priority:** Level 1 — Essential | **Estimated Study Time:** 2.5 hours

---

## Concept 2: `useEffect` Cleanup Functions (Tear Down)

### 1. Concept Name
Effect Teardown & Resource Cleanup

### 2. Why It Exists
Certain side effects establish ongoing connections or background listeners (e.g., Server-Sent Events, WebSockets, `setInterval`, window event listeners). If a user navigates away to another page without closing these connections, the connection stays open, creating **memory leaks** and attempting to update state on unmounted components.

### 3. How It Works
- If the function passed to `useEffect` returns a function, React treats it as a **cleanup function**.
- React executes this cleanup function:
  1. Immediately before re-running the effect (when dependencies change).
  2. When the component unmounts from the DOM.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/StayDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StayDetailPage.tsx#L82-L91)
- **Component:** `StayDetailPage` — subscribing and unsubscribing from SSE availability streams.

### 5. Actual Code Example
```typescript
// client/src/pages/StayDetailPage.tsx
// Real-time subscription to SSE
useEffect(() => {
  if (!id) return;
  const unsubscribe = apiService.subscribeStayAvailability(id, () => {
    fetchLiveAvailability();
  });
  return () => {
    unsubscribe();
  };
}, [id, fetchLiveAvailability]);
```

### 6. Line-by-Line Explanation
- **Line 4:** `apiService.subscribeStayAvailability` opens an `EventSource` connection to `/api/stays/:id/availability/stream` and returns an `unsubscribe` closure that calls `es.close()`.
- **Line 7:** `return () => { unsubscribe(); };` registers the cleanup callback with React.
- When the user navigates back to the search page, React automatically invokes `unsubscribe()`, closing the HTTP streaming socket on the server.

### 7. Execution Flow
1. User enters `/stays/stay-mun-01`.
2. `useEffect` opens the SSE stream socket.
3. User clicks "Back to Stays".
4. Component unmounts.
5. React invokes `unsubscribe()`, calling `es.close()`. No orphan network connections remain.

### 8. Interview Questions
1. *When exactly does React execute an effect's cleanup function?*
2. *What happens if you do not close an `EventSource` or `WebSocket` when a component unmounts?*
3. *Why does React StrictMode run `useEffect` and its cleanup twice on initial mount in development?*

### 9. Practical Exercise
Write a `useEffect` that listens to the `keydown` event on `window` to close a modal when the user presses the `Escape` key, and returns a cleanup function removing the listener via `window.removeEventListener`.

### 10. Prerequisites
`useEffect` basics and event listeners.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 3: The `useCallback` Hook (Memoized Callbacks)

### 1. Concept Name
Function Reference Memoization (`useCallback`)

### 2. Why It Exists
In JavaScript, functions are reference objects. Every time a component re-renders, any function declared inside it is recreated with a **brand new memory reference** (`() => {} !== () => {}`). If that function is passed as a prop to a child component or listed in an effect's dependency array, it tricks React into thinking the prop changed, triggering unnecessary re-renders.

### 3. How It Works
- `const memoizedFn = useCallback(fn, [dependencies]);`
- React caches the function reference across renders. It only creates a new reference if one of the specified dependencies changes.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/MyBookingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/MyBookingsPage.tsx#L33-L48)
- **Component:** `MyBookingsPage` — memoizing `fetchBookings`.

### 5. Actual Code Example
```typescript
// client/src/pages/MyBookingsPage.tsx
const fetchBookings = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const [homestayData, guideData] = await Promise.all([
      apiService.getMyBookings(),
      apiService.getTouristGuideBookings().catch(() => []),
    ]);
    setBookings(homestayData);
    setGuideBookings(guideData);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to retrieve your bookings');
  } finally {
    setLoading(false);
  }
}, []);
```

### 6. Line-by-Line Explanation
- **Line 1:** `useCallback` memoizes the `fetchBookings` async arrow function.
- **Line 16:** The empty dependency array `[]` ensures `fetchBookings` retains the exact same function reference across all re-renders of `MyBookingsPage`.

### 7. Execution Flow
1. Component mounts; `fetchBookings` is created.
2. `fetchBookings` runs inside `useEffect`.
3. User toggles the tab between "Homestays" and "Guides" (`setActiveTab`).
4. `MyBookingsPage` re-renders.
5. `useCallback` returns the existing function reference; `useEffect` does NOT re-fire unnecessarily.

### 8. Interview Questions
1. *Does `useCallback` make code run faster by default? When can overusing it hurt performance?*
2. *What is the relationship between `useCallback` and `React.memo`?*
3. *What happens if you omit a state variable from a `useCallback` dependency array?*

### 9. Practical Exercise
Look at [client/src/context/AuthContext.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/context/AuthContext.tsx#L29-L80). Notice that `login`, `register`, `logout`, and `refreshUser` are all wrapped in `useCallback`. Explain why this is critical for consumers of `AuthContext`.

### 10. Prerequisites
JavaScript closures, object reference equality (`===`), and `useEffect`.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 4: The `useMemo` Hook (Memoized Values & Calculations)

### 1. Concept Name
Computed Value Memoization (`useMemo`)

### 2. Why It Exists
During component re-renders, complex calculations (e.g., date parsing, tax calculations, array sorting, or constructing complex config objects) are recalculated on every single render. `useMemo` caches the calculated result and only recomputes it when specified dependencies change.

### 3. How It Works
- `const cachedValue = useMemo(() => calculateValue(a, b), [a, b]);`
- Runs during rendering.
- If dependencies are unchanged, React skips the calculation and returns the previously cached value.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/booking/BookingModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/booking/BookingModal.tsx#L42-L58)
- **Component:** `BookingModal` — computing default check-in and check-out dates.

### 5. Actual Code Example
```typescript
// client/src/components/booking/BookingModal.tsx
const defaultCheckInDate = useMemo(() => {
  if (initialCheckIn) {
    return initialCheckIn.split('T')[0];
  }
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}, [initialCheckIn]);
```

### 6. Line-by-Line Explanation
- **Line 1:** `useMemo` computes tomorrow's date formatted as `YYYY-MM-DD`.
- **Line 7:** `[initialCheckIn]` ensures the date calculation only runs once when the modal opens or when `initialCheckIn` changes, rather than recalculating on every input keystroke.

### 7. Execution Flow
1. Modal opens with `initialCheckIn="2026-12-01T12:00"`.
2. `useMemo` extracts `"2026-12-01"` and stores it in memory.
3. User types in the "Special Requests" text area.
4. `BookingModal` re-renders with every keystroke, but `defaultCheckInDate` is instantly retrieved from cache.

### 8. Interview Questions
1. *What is the fundamental difference between `useMemo` and `useCallback`?*
2. *Can `useMemo` be used to achieve reference stability for objects passed to child components?*
3. *Why shouldn't you wrap every single variable in `useMemo`?*

### 9. Practical Exercise
Inspect [client/src/context/AuthContext.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/context/AuthContext.tsx#L82-L99). Explain how `useMemo` memoizes the `AuthContextValue` object and what would happen to all components calling `useAuth()` if this `useMemo` were removed.

### 10. Prerequisites
Pure functions, component re-rendering, and `useCallback`.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 5: Custom Hooks Pattern (`useAuth`)

### 1. Concept Name
Custom React Hooks

### 2. Why It Exists
Component logic often needs to be reused across different views (e.g., accessing the logged-in user, verifying permissions, or handling authentication). Custom hooks allow developers to extract stateful component logic into reusable functions that adhere to React's Hook rules.

### 3. How It Works
- A custom hook is a JavaScript function whose name begins with `use` (e.g., `useAuth`, `useDebounce`).
- Can call other React hooks internally (`useContext`, `useState`, `useEffect`).
- Enforces runtime boundary checks: if a consumer tries to use the hook outside its required Provider, it throws an informative descriptive error immediately.

### 4. StayLocal Implementation
- **File Reference:** [client/src/hooks/useAuth.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/hooks/useAuth.ts#L1-L10)
- **Hook:** `useAuth`

### 5. Actual Code Example
```typescript
// client/src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../context/AuthContext';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 6. Line-by-Line Explanation
- **Line 4:** Declares `useAuth` returning the strongly typed `AuthContextValue`.
- **Line 5:** Consumes `AuthContext` via React's built-in `useContext`.
- **Lines 6–8:** **Fail-Fast Boundary Invariant:** If `useAuth()` is called in a component not wrapped in `<AuthProvider>`, it immediately throws a clear exception rather than failing later with `TypeError: Cannot read properties of undefined (reading 'user')`.

### 7. Execution Flow
1. Developer writes `const { user, isAuthenticated } = useAuth();` in `Header.tsx`.
2. `useAuth` looks up the nearest `AuthContext.Provider` up the component tree.
3. If found, returns the session object. If missing, throws an actionable error.

### 8. Interview Questions
1. *What are the "Rules of Hooks" that custom hooks must strictly obey?*
2. *Does sharing a custom hook between two components share the state itself or only the stateful logic?*
3. *Why must custom hook names start with the prefix `use`?*

### 9. Practical Exercise
Write a custom hook `useDocumentTitle(title: string)` that updates the browser tab title (`document.title = title`) whenever `title` changes using `useEffect`.

### 10. Prerequisites
`useContext` and the Rules of Hooks.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 6: Skeleton Loading States (`animate-pulse`)

### 1. Concept Name
Perceived Performance with Skeleton Screens

### 2. Why It Exists
Traditional loading spinners (e.g., a centered circular spinner) cause layout shift (Cumulative Layout Shift, CLS) when content pops in, giving a jarring user experience. Skeleton screens render blank gray placeholders that mirror the exact physical layout of the incoming content, drastically improving perceived performance.

### 3. How It Works
- When `loading === true`, the component returns a placeholder DOM structure matching the dimensions of the final page.
- Tailwind's `animate-pulse` utility applies a CSS keyframe animation that gently fades the background opacity from 100% to 50% and back.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/DestinationDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/DestinationDetailPage.tsx#L44-L55)
- **Component:** `DestinationDetailPage`

### 5. Actual Code Example
```typescript
// client/src/pages/DestinationDetailPage.tsx
if (loading) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8 animate-pulse">
      <div className="h-6 w-32 bg-sand-200 rounded" />
      <div className="h-96 bg-sand-200 rounded-3xl" />
      <div className="space-y-4">
        <div className="h-8 bg-sand-200 rounded w-1/2" />
        <div className="h-24 bg-sand-200 rounded" />
      </div>
    </div>
  );
}
```

### 6. Line-by-Line Explanation
- **Line 3:** `animate-pulse` creates a pulsing shimmer effect across all child skeleton blocks.
- **Line 4:** `h-6 w-32 bg-sand-200 rounded` mimics the breadcrumb navigation bar.
- **Line 5:** `h-96 rounded-3xl` reserves space for the hero banner image, preventing layout shift when the image finishes loading.

### 7. Execution Flow
1. User navigates to `/destinations/munsiyari`.
2. `loading` is initially `true`.
3. The pulsing skeleton screen immediately renders.
4. When `fetchDestination()` finishes, `loading` becomes `false`.
5. The real content seamlessly replaces the skeleton boxes.

### 8. Interview Questions
1. *What is Cumulative Layout Shift (CLS), and how do skeleton screens reduce it?*
2. *How do skeleton screens compare to traditional spinning loaders in user experience studies?*
3. *How is `animate-pulse` implemented in pure CSS?*

### 9. Practical Exercise
Inspect [client/src/pages/StayDetailPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StayDetailPage.tsx#L111-L122). Modify the skeleton loader to add a placeholder block for the live booking widget in the right column.

### 10. Prerequisites
Conditional rendering and basic CSS animations.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 1.5 hours
