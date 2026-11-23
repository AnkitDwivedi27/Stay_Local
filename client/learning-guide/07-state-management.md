# Phase 6: State Management & Data Flow in StayLocal

> **Scope:** Local state, state lifting, Context API architecture, derived computations, optimistic updates, and offline fallback synchronization in StayLocal.  
> **Target Mastery:** Level 1 (Essential) & Level 2 (Intermediate)

---

## Concept 1: State Lifting (Lifting State Up)

### 1. Concept Name
State Lifting Pattern

### 2. Why It Exists
In React, sibling components cannot directly inspect or modify each other's state. When two or more sibling components need to reflect or manipulate the same data (e.g., a filter bar component containing inputs, and a catalog grid component rendering the matching cards), keeping filter state inside the filter bar leaves the grid completely blind to user selections. Lifting state up moves the state to their **closest common ancestor**.

### 3. How It Works
- The common parent holds the shared state (`const [category, setCategory] = useState('')`).
- The parent passes the current value down to the sibling that needs it (`<StayFilterBar category={category} onCategoryChange={setCategory} />`).
- The parent passes the filtered data down to the other sibling (`<StaysGrid stays={filteredStays} />`).

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/StaysPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StaysPage.tsx#L94-L101)
- **Component:** `StaysPage` (Parent) and `StayFilterBar` (Child)

### 5. Actual Code Example
```typescript
// client/src/pages/StaysPage.tsx
<StayFilterBar
  destination={destinationFilter}
  onDestinationChange={setDestinationFilter}
  category={categoryFilter}
  onCategoryChange={setCategoryFilter}
  verificationStatus={verificationFilter}
  onVerificationStatusChange={setVerificationFilter}
/>
```

### 6. Line-by-Line Explanation
- **Line 2:** Passes current `destinationFilter` state down to `StayFilterBar`.
- **Line 3:** Passes the `setDestinationFilter` updater callback to `StayFilterBar`. When the user changes the destination dropdown inside the filter bar, it invokes `onDestinationChange(newValue)`, updating the parent `StaysPage` state.

### 7. Execution Flow
1. User selects "Bhimtal" in `StayFilterBar`.
2. `StayFilterBar` fires `props.onDestinationChange('bhimtal')`.
3. Parent `StaysPage` receives the value and calls `setDestinationFilter('bhimtal')`.
4. `StaysPage` re-renders; its `useEffect` triggers a new API query for Bhimtal homestays.
5. The updated stays list renders in the grid below.

### 8. Interview Questions
1. *What problem does "lifting state up" solve in React?*
2. *How do you decide which component should own a specific piece of state?*
3. *What are the drawbacks of lifting state up too high in the component tree?*

### 9. Practical Exercise
Inspect [client/src/components/stays/StayFilterBar.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/stays/StayFilterBar.tsx). Trace all 5 callback props passed from `StaysPage` and explain how clearing all filters resets parent state.

### 10. Prerequisites
Props, callbacks, and `useState`.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 2: The Context API Architecture (`AuthContext`)

### 1. Concept Name
Global State Management with React Context API

### 2. Why It Exists
Passing authentication state, user identity, and session tokens down through 10 layers of components (from `App` to `RootLayout`, to `Header`, to `UserMenu`, to `Avatar`) is called **prop drilling**. It makes intermediate components cluttered with props they don't even use. React Context provides a way to share data globally across the entire component tree without manual prop passing at every level.

### 3. How It Works
1. **`createContext()`:** Creates a Context object.
2. **`Context.Provider`:** Wraps a subtree and provides the `value` object to all descendants.
3. **`useContext(Context)`:** Any component nested anywhere under the Provider can consume the value directly.

### 4. StayLocal Implementation
- **File Reference:** [client/src/context/AuthContext.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/context/AuthContext.tsx#L22-L102)
- **Component:** `AuthProvider` & `AuthContext`

### 5. Actual Code Example
```typescript
// client/src/context/AuthContext.tsx
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role: user?.role || null,
      isHost: user?.role === 'host',
      isGuide: user?.role === 'guide',
      isAdmin: user?.role === 'admin',
      isTourist: user?.role === 'tourist',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 6. Line-by-Line Explanation
- **Line 1:** Creates `AuthContext` with an initial value of `undefined`.
- **Lines 3–4:** `AuthProvider` manages `user` and `loading` state.
- **Lines 6–21:** Memoizes the `value` bundle, exposing user details, role convenience booleans (`isHost`, `isAdmin`), and async action triggers.
- **Line 23:** Wraps `{children}` with `<AuthContext.Provider value={value}>`.

### 7. Execution Flow
1. `App.tsx` wraps all routes in `<AuthProvider>`.
2. On mount, `AuthProvider` verifies user session via `apiService.getMe()`.
3. If logged in, `setUser(userData)` sets the active user.
4. Anywhere in the application (e.g., `Header.tsx`), calling `useAuth()` immediately returns `{ user, isHost, logout }`.

### 8. Interview Questions
1. *When should you use React Context vs. external state libraries like Redux or Zustand?*
2. *Why does changing a Context value cause all consuming components to re-render? How can this be optimized?*
3. *Why should you wrap the Context `value` object in `useMemo`?*

### 9. Practical Exercise
Inspect [client/src/components/common/Header.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/common/Header.tsx#L13). Identify which properties are extracted from `useAuth()` and how they conditionally alter the navigation links shown to an Admin vs. a Host vs. an unauthenticated guest.

### 10. Prerequisites
React hooks, `createContext`, and `useMemo`.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.5 hours

---

## Concept 3: Derived State vs. Redundant State

### 1. Concept Name
Derived State (Calculated Properties)

### 2. Why It Exists
A common beginner mistake is creating state for data that can be calculated from existing state (e.g., creating `const [verifiedStays, setVerifiedStays] = useState([])` alongside `const [stays, setStays] = useState([])`). Storing duplicate state leads to **state synchronization bugs**: updating `stays` without updating `verifiedStays` leaves the UI showing contradictory data.

### 3. How It Works
- Do not store calculated values in state.
- Compute them on-the-fly during the component render cycle, or wrap them in `useMemo` if the computation is expensive.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/booking/BookingModal.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/booking/BookingModal.tsx#L120-L145)
- **Component:** `BookingModal` — calculating pricing and guest counts.

### 5. Actual Code Example
```typescript
// client/src/components/booking/BookingModal.tsx
const totalGuests = adults + children;
const nights = calculateNights(checkInDate, checkOutDate);
const basePrice = stay ? stay.pricePerNight * nights : 0;
const communityFee = Math.round(basePrice * 0.05); // 5% StayLocal Community Fund
const grandTotal = basePrice + communityFee;
```

### 6. Line-by-Line Explanation
- **Line 1:** `totalGuests` is calculated directly from `adults` and `children` state variables.
- **Lines 2–5:** `nights`, `basePrice`, `communityFee`, and `grandTotal` are calculated synchronously during render. No redundant `setGrandTotal` state calls are needed.

### 7. Execution Flow
1. User changes the guest counter from 1 to 2.
2. `setAdults(2)` triggers a re-render.
3. During re-render, `totalGuests`, `basePrice`, and `grandTotal` recalculate instantly.
4. The pricing table in the modal updates with 100% mathematical consistency.

### 8. Interview Questions
1. *What is "derived state", and why is it preferred over redundant state?*
2. *When should derived state be wrapped in `useMemo`?*
3. *What are the risks of synchronizing props to state using `useEffect`?*

### 9. Practical Exercise
Find the status counter metrics in [client/src/pages/StaysPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/StaysPage.tsx#L61-L63). Explain why `verifiedCount`, `pendingCount`, and `leadCount` are computed directly rather than stored in separate `useState` hooks.

### 10. Prerequisites
Variables, mathematical operators, and React rendering.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 1.5 hours

---

## Concept 4: Optimistic vs. Pessimistic UI Updates

### 1. Concept Name
State Synchronization Strategies (Optimistic vs. Pessimistic Updates)

### 2. Why It Exists
When users perform an action (e.g., a host confirming a booking or saving an edited listing), waiting for the server to reply over a high-latency network connection before updating the screen feels sluggish.
- **Pessimistic Update:** Waits for server confirmation before updating UI (used for high-stakes actions like booking confirmations).
- **Optimistic Update:** Instantly updates the local UI assuming success, and rolls back if the server returns an error.

### 3. How It Works
- **StayLocal Strategy:** For financial reservations and host listing saves, StayLocal employs **Reliable Pessimistic Updates** with active loading spinners (`processingId`) to guarantee data integrity, followed by functional state synchronization `setBookings(prev => prev.map(...))`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/pages/HostBookingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HostBookingsPage.tsx#L49-L66)
- **Component:** `HostBookingsPage` — confirming a reservation.

### 5. Actual Code Example
```typescript
// client/src/pages/HostBookingsPage.tsx
const handleConfirm = async (bookingId: string) => {
  try {
    setProcessingId(bookingId);
    setActionError(null);
    setActionSuccess(null);
    const updated = await apiService.confirmBooking(bookingId);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    setActionSuccess(`Reservation ${updated.bookingReference} confirmed successfully! Beds and dates are locked.`);
  } catch (err) {
    setActionError(
      err instanceof Error
        ? err.message
        : 'Unable to confirm booking. It may conflict with an existing reservation.'
    );
  } finally {
    setProcessingId(null);
  }
};
```

### 6. Line-by-Line Explanation
- **Line 3:** `setProcessingId(bookingId)` disables buttons and shows an active spinner for that specific booking row.
- **Line 6:** `await apiService.confirmBooking(bookingId)` calls the backend, which locks capacity inside a MongoDB ACID transaction.
- **Line 7:** `setBookings((prev) => prev.map(...))` replaces the old pending booking with the updated confirmed record returned by the server.
- **Line 16:** `setProcessingId(null)` clears the loading state.

### 7. Execution Flow
1. Host clicks "Confirm Reservation".
2. UI displays spinner on that row.
3. Server executes confirmation and returns updated booking document.
4. React updates only that single item in state, turning its badge to green "Confirmed".

### 8. Interview Questions
1. *What is the difference between an optimistic update and a pessimistic update?*
2. *How do you implement rollback in an optimistic UI update if the server request fails?*
3. *Why is pessimistic updating preferred for high-concurrency booking and financial transactions?*

### 9. Practical Exercise
Inspect [client/src/pages/HostListingsPage.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/pages/HostListingsPage.tsx#L63-L72). Explain how `handleListingSaved` uses `prev.findIndex` to either replace an edited listing or prepend a newly created listing to the top of the list.

### 10. Prerequisites
Asynchronous JavaScript, array immutability (`map`, `filter`), and `useState`.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 2.5 hours
