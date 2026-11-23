# Phase 8: Authentication & Security Architecture in StayLocal

> **Scope:** JWT cookie management, silent session rehydration, role-based access control (RBAC), route guarding, and defense-in-depth security in StayLocal.  
> **Target Mastery:** Level 1 (Essential) to Level 3 (Advanced)

---

## Concept 1: JWT Session Architecture & HttpOnly Cookie Storage

### 1. Concept Name
JWT Authentication with Secure HttpOnly Cookies

### 2. Why It Exists
Many tutorials store JSON Web Tokens (JWTs) in `localStorage`. However, `localStorage` is accessible to **any JavaScript running on the page**. If a malicious third-party script, compromised dependency, or XSS vulnerability runs in the browser, an attacker can steal the JWT via `localStorage.getItem('token')` and permanently hijack the user's account. Storing the JWT inside an `HttpOnly` cookie makes the token completely invisible and inaccessible to client-side JavaScript.

### 3. How It Works
- **Login/Register:** User submits credentials.
- **Server sets Cookie:** Upon successful authentication, the server responds with a `Set-Cookie` header:
  `Set-Cookie: staylocal_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
- **Browser Protection:**
  - `HttpOnly`: JavaScript cannot access `document.cookie` (immune to XSS token theft).
  - `Secure`: Cookie is only sent over encrypted HTTPS connections (immune to network eavesdropping).
  - `SameSite=Strict`: Cookie is not sent on cross-site requests (protects against CSRF).
- **Subsequent Requests:** Browser automatically attaches `Cookie: staylocal_token=...` on all requests to `/api/*`.

### 4. StayLocal Implementation
- **File Reference:** [server/src/utils/token.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/utils/token.ts#L24-L35) and [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L483-L485)
- **Role:** Full-stack authentication boundary.

### 5. Actual Code Example
```typescript
// server/src/utils/token.ts
export function setAuthCookie(res: Response, token: string): void {
  const isProduction = env.NODE_ENV === 'production';
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: sevenDaysMs,
    path: '/',
  });
}
```

### 6. Line-by-Line Explanation
- **Line 5:** Sets the cookie named `staylocal_token`.
- **Line 6:** `httpOnly: true` blocks JavaScript reading via `document.cookie`.
- **Line 7:** `secure: isProduction` mandates HTTPS in production.
- **Line 8:** `sameSite: isProduction ? 'strict' : 'lax'` defends against cross-site forged requests.
- **Line 9:** Sets persistent expiration to 7 days.

### 7. Execution Flow
1. User logs in.
2. Server validates password and signs JWT.
3. Server issues `setAuthCookie(res, token)`.
4. Browser receives cookie and locks it in the secure browser store.
5. All future API calls automatically carry authentication without manual header injection.

### 8. Interview Questions
1. *Why is `localStorage` considered insecure for storing JWT authentication tokens?*
2. *What does the `HttpOnly` flag prevent, and what does it NOT prevent?*
3. *What is the difference between `SameSite=Strict` and `SameSite=Lax`?*

### 9. Practical Exercise
Inspect [client/src/services/api.ts](file:///c:/Users/HP/Downloads/Major%20Project/client/src/services/api.ts#L1068). Notice `logout()`. Explain why logging out requires an API call to the server rather than simply deleting state in React.

### 10. Prerequisites
HTTP cookies, HTTPS, and JWT basics.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.5 hours

---

## Concept 2: Silent Session Rehydration (`refreshUser`)

### 1. Concept Name
Session Rehydration on Application Boot

### 2. Why It Exists
Since the JWT is stored inside an inaccessible `HttpOnly` cookie, React cannot read the cookie to know who is logged in when the browser tab is refreshed. If React initialized with `user = null`, the user would appear logged out on every refresh. Session rehydration makes an immediate silent background request to `/api/auth/me` on startup to rehydrate user identity.

### 3. How It Works
- On mount, `AuthProvider` initializes `loading = true`.
- An effect triggers `refreshUser()`, querying `GET /api/auth/me` with `credentials: 'include'`.
- If the cookie is valid, the server returns the user profile (`{ id, email, role, fullName }`), and React sets `user`.
- If the cookie is expired or missing, it catches the 401 error, sets `user = null`, and sets `loading = false`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/context/AuthContext.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/context/AuthContext.tsx#L29-L45)
- **Component:** `AuthProvider`

### 5. Actual Code Example
```typescript
// client/src/context/AuthContext.tsx
const refreshUser = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const currentUser = await apiService.getMe();
    setUser(currentUser);
  } catch (err) {
    setUser(null);
    setError(err instanceof Error ? err.message : 'Failed to retrieve session');
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  refreshUser();
}, [refreshUser]);
```

### 6. Line-by-Line Explanation
- **Line 1:** Declares `refreshUser` wrapped in `useCallback`.
- **Line 5:** `await apiService.getMe()` sends a GET request to `/api/auth/me` carrying the `staylocal_token` cookie.
- **Line 6:** On success, sets the active user in state.
- **Line 8:** On failure (e.g., user is not logged in), resets user state to `null`.
- **Line 11:** `setLoading(false)` unblocks protected route rendering.

### 7. Execution Flow
1. User refreshes their browser on `/host/listings`.
2. `AuthProvider` mounts with `loading: true`.
3. Screen displays a subtle Himalayan session verification spinner.
4. `apiService.getMe()` returns the host user profile.
5. `user` is set, `loading` becomes `false`.
6. Host listings render immediately without requiring the user to re-login.

### 8. Interview Questions
1. *What is a "flash of unauthenticated content" (FOUC), and how does the `loading` state prevent it?*
2. *Why is `refreshUser` declared with `useCallback`?*
3. *What happens if the network is completely offline during session rehydration?*

### 9. Practical Exercise
Inspect [client/src/components/auth/ProtectedRoute.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/auth/ProtectedRoute.tsx#L19-L27). Notice the `if (loading)` block. Explain what would happen to protected routes if this loading check were omitted.

### 10. Prerequisites
`useEffect`, `useCallback`, and asynchronous fetch.  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.0 hours

---

## Concept 3: Role-Based Route Guarding (`ProtectedRoute`)

### 1. Concept Name
Role-Based Access Control (RBAC) Route Guard Pattern

### 2. Why It Exists
Different user personas have strictly segregated responsibilities in StayLocal:
- **Tourists** can create booking requests and view personal trips.
- **Hosts** can manage properties, confirm bookings, and upload verification proof.
- **Guides** manage cultural tours and excursions.
- **Admins** review verification documentation and assign homestay properties.
Allowing a Tourist to view the Admin assignment dashboard would violate data privacy and system integrity. `<ProtectedRoute>` acts as a gatekeeper in the routing tree.

### 3. How It Works
- Accepts optional `allowedRoles?: UserRole[]` (e.g. `['admin']` or `['host', 'admin']`).
- **Phase 1 (Verification):** If `loading === true`, displays the loading screen.
- **Phase 2 (Authentication):** If `!isAuthenticated || !user`, redirects to `/login` with `state={{ from: location }}`.
- **Phase 3 (Authorization):** If `allowedRoles` is specified and `user.role` is not included in the array, blocks rendering and displays an **Access Restricted Notice**.
- **Phase 4 (Access Granted):** If all checks pass, renders `{children}` or `<Outlet />`.

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/auth/ProtectedRoute.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/auth/ProtectedRoute.tsx#L12-L55)
- **Component:** `ProtectedRoute`

### 5. Actual Code Example
```typescript
// client/src/components/auth/ProtectedRoute.tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="...">Verifying Himalayan Session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-center">
        <h2>Access Restricted</h2>
        <p>Your account role is {user.role}. This portal requires {allowedRoles.join(' or ')}.</p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
```

### 6. Line-by-Line Explanation
- **Lines 8–10:** Halts execution while session is being verified.
- **Lines 12–14:** Redirects anonymous visitors to `/login`, preserving current path in history state.
- **Lines 16–23:** Checks `allowedRoles.includes(user.role)`. If unauthorized, renders an informative alert showing their current role and needed permissions.
- **Line 25:** Grants access, projecting children or child outlet.

### 7. Execution Flow
1. Tourist attempts to access `/admin/verification`.
2. `ProtectedRoute` mounts with `allowedRoles={['admin']}`.
3. `user.role === 'tourist'`.
4. `['admin'].includes('tourist')` evaluates to `false`.
5. Screen displays "Access Restricted: This portal requires admin privileges."

### 8. Interview Questions
1. *Why is client-side route protection alone NOT sufficient for application security?*
2. *What is the difference between Authentication (AuthN) and Authorization (AuthZ)?*
3. *How does `ProtectedRoute` handle nested child routes via `<Outlet />`?*

### 9. Practical Exercise
Inspect [client/src/App.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/App.tsx#L53-L97). List which roles are granted access to:
- `/bookings`
- `/host/listings`
- `/admin/assignments`

### 10. Prerequisites
React Router, Context API, and array methods (`includes`).  
**Priority:** Level 2 — Intermediate | **Estimated Study Time:** 2.5 hours

---

## Concept 4: Client vs. Server Authorization (Defense in Depth)

### 1. Concept Name
Defense in Depth (Client-Side Gatekeeping vs. Server-Side Enforcement)

### 2. Why It Exists
A common misconception is that hiding buttons or redirecting routes in React protects data. However, **any client-side code can be modified or bypassed** by opening DevTools, modifying JavaScript in memory, or sending raw HTTP requests using `curl` or Postman.
- **Client-Side Authorization:** Provides **User Experience (UX)**. It ensures users only see buttons and pages relevant to their workflow and aren't confused by admin controls.
- **Server-Side Authorization:** Provides **True Security**. It enforces permissions on the database layer; any unauthorized API request is rejected with `403 Forbidden` regardless of what the client does.

### 3. How It Works
1. In the client, `ProtectedRoute` hides the `/admin/assignments` screen from non-admins.
2. In the backend, `requireRole('admin')` middleware intercepts `POST /api/admin/assignments` and asserts `req.user.role === 'admin'`.
3. If an attacker bypasses the React UI and curls the endpoint, the backend immediately halts execution:
   ```json
   { "error": { "code": "FORBIDDEN", "message": "Access requires role: admin" } }
   ```

### 4. StayLocal Implementation
- **File Reference:** [client/src/components/auth/ProtectedRoute.tsx](file:///c:/Users/HP/Downloads/Major%20Project/client/src/components/auth/ProtectedRoute.tsx) and [server/src/middleware/auth.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/auth.ts#L50-L68)
- **Role:** Complementary defense layers.

### 5. Actual Code Example
```typescript
// server/src/middleware/auth.ts (The Server Guard)
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Access requires one of [${allowedRoles.join(', ')}]. Active role is '${req.user.role}'.`
        )
      );
    }
    next();
  };
}
```

### 6. Line-by-Line Explanation
- **Line 1:** Higher-order Express middleware function accepting variable allowed roles.
- **Line 4:** If unauthenticated, rejects with `401 Unauthorized`.
- **Line 7:** If user role does not match, rejects with `403 Forbidden`.
- **Line 13:** If verified, passes control to the service layer.

### 7. Execution Flow
1. Tourist inspects DOM and forces a redirect to `/admin/assignments`.
2. Tourist tries to submit an assignment payload.
3. Express server runs `requireRole('admin')`.
4. Request is rejected with `403 Forbidden`. Database remains 100% secure.

### 8. Interview Questions
1. *Why should you never rely solely on frontend route guards for security?*
2. *What is the difference between HTTP 401 Unauthorized and HTTP 403 Forbidden?*
3. *What is the "Principle of Least Privilege" in web security?*

### 9. Practical Exercise
Review [server/src/routes/auth.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/auth.route.ts#L16-L44). Trace how `authenticate` and `requireRole('host', 'admin')` guard the `/auth/host-only` endpoint.

### 10. Prerequisites
HTTP status codes (401 vs 403) and middleware concepts.  
**Priority:** Level 3 — Advanced | **Estimated Study Time:** 2.0 hours
