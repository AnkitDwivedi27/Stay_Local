# Module 3: Express Middleware Architecture in StayLocal

> **Scope:** The Express middleware pipeline, `next()`, authentication, RBAC, Zod validation, error handling, rate limiting, and CORS in StayLocal.  
> **Target Mastery:** Level 1 (Essential) to Level 2 (Intermediate)

---

## Concept 1: Middleware Fundamentals & The `next()` Function

### 1. Concept Name
Express Middleware and the `next()` Pipeline Mechanism

### 2. Simple Definition
Middleware is a function that sits between an incoming HTTP request and the final controller route handler. It has access to the `req` (Request) object, `res` (Response) object, and a special function called `next()`. Middleware can inspect the request, modify it, reject it early (e.g. if unauthenticated), or call `next()` to pass control down to the next function in the chain.

### 3. Real-World Analogy
Airport security checkpoints: before you board an airplane (the controller that delivers the flight), you pass through metal detectors (CORS/rate limiter), passport control (Authentication middleware), and baggage scanners (Body parser/Zod validator). If any check fails, security turns you away immediately; if you pass, they stamp your boarding pass and say "Next please!" (`next()`).

### 4. Why Developers Need It
Without middleware, every single controller function would need to repeat 20 lines of boilerplate: parsing cookies, validating JWT tokens, checking user roles, parsing JSON bodies, and catching errors. Middleware isolates cross-cutting concerns into reusable pipeline steps.

### 5. How StayLocal Uses It
Every incoming request in StayLocal flows through a sequenced stack of middleware declared in [server/src/app.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/app.ts#L16-L56).

### 6. Actual File Location
- **File:** [server/src/app.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/app.ts#L16-L56)
- **Functions:** Global middleware pipeline.

### 7. Code Explanation
```typescript
// server/src/app.ts
app.use(cors({ ... }));                 // 1. Validates Origin
app.use(cookieParser());                // 2. Parses Cookie header into req.cookies
app.use(express.json({ limit: '15mb' })); // 3. Parses JSON body into req.body
app.use(express.urlencoded({ ... }));   // 4. Parses URL-encoded form bodies
app.use('/api', apiRouter);              // 5. Mounts route handlers
app.use(notFoundHandler);               // 6. Catches unmatched URLs (404)
app.use(errorHandler);                  // 7. Catches all errors (500/400)
```
- Each `.use()` call registers a middleware layer.
- If a client makes a malformed request, `express.json()` rejects it before it ever reaches route controllers.

### 8. Execution Flow
1. Client sends HTTP request.
2. Layer 1 executes $\rightarrow$ calls `next()`.
3. Layer 2 executes $\rightarrow$ calls `next()`.
4. Layer 3 executes $\rightarrow$ calls `next()`.
5. Route handler executes $\rightarrow$ calls `res.json()`.
6. Request completes; execution does not proceed to `notFoundHandler`.

### 9. Common Mistakes
- **Forgetting to call `next()`:** If your custom middleware does not send a response (`res.send`) AND does not call `next()`, the client request hangs indefinitely until the browser times out.

### 10. Interview Questions
1. *What happens if you pass an argument to `next(err)` in Express?*  
   **Answer:** Express skips all remaining standard middleware and route handlers, immediately jumping to the first registered 4-parameter error-handling middleware (`errorHandler`).
2. *What is the execution order of middleware in Express?*  
   **Answer:** Strictly linear: middleware executes in the exact order it is registered with `app.use()` or passed in route arrays.

### 11. Practical Exercise
Trace what happens if a client requests an unknown URL like `GET /api/nonexistent`. Explain why `notFoundHandler` executes instead of `errorHandler`.

---

## Concept 2: Authentication Middleware (`authenticate`)

### 1. Concept Name
Session Authentication Middleware (`authenticate`)

### 2. Simple Definition
The `authenticate` middleware intercepts protected requests, extracts the JWT session token from either the `HttpOnly` cookie or the `Authorization: Bearer` header, cryptographically verifies its signature and expiration, retrieves the active user from the database, and attaches the user object to `req.user`.

### 3. Real-World Analogy
An office security guard stationed at the elevator: you present your keycard (cookie/token). The guard scans it against the security computer. If it's valid, the guard clips a temporary visitor badge onto your jacket (`req.user = user`) and presses the elevator button (`next()`). If the card is expired or fake, the guard escorts you out (`401 Unauthorized`).

### 4. Why Developers Need It
Individual controllers should never worry about parsing JWTs or checking database user records. They should simply assume that if `req.user` exists, the identity is verified and authoritative.

### 5. How StayLocal Uses It
Used across all protected routes in StayLocal (e.g. creating bookings, viewing personal reservations, managing host properties, and administrative governance).

### 6. Actual File Location
- **File:** [server/src/middleware/auth.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/auth.ts#L17-L48)
- **Function:** `authenticate()`

### 7. Code Explanation
```typescript
// server/src/middleware/auth.ts
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Check HttpOnly cookie first, then fallback to Authorization header
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0]?.toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    // 2. Verify JWT signature and expiration
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token.');
    }

    // 3. Confirm user existence and active status in database
    const user = await AuthService.getCurrentUser(payload.id);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
```
- **Lines 4–11:** Inspects `req.cookies.staylocal_token` (web browser client). If missing, inspects `Authorization: Bearer <token>` (mobile apps, Postman).
- **Lines 17–22:** `verifyToken(token)` verifies the secret HMAC signature and confirms token has not expired.
- **Line 25:** Confirms the user still exists in the database and is `status: 'active'`. (Crucial: revokes access if an account was suspended after the token was issued!).
- **Line 26:** Attaches the verified user to `req.user`.
- **Line 27:** `next()` yields to the route handler.

### 8. Execution Flow
1. Request arrives at a guarded route.
2. `authenticate()` checks for cookie.
3. If valid, fetches user and attaches to `req.user`.
4. If token is expired, throws `UnauthorizedError(401)`, caught by `catch(err)` and passed to `next(err)`.
5. Error handler returns standard 401 JSON response.

### 9. Common Mistakes
- **Trusting the JWT Payload Without Database Verification:** If you only decode the JWT and don't check the database, a deleted or banned user can continue accessing your API until their token expires (up to 7 days later). StayLocal avoids this by confirming user status with `AuthService.getCurrentUser(payload.id)`.

### 10. Interview Questions
1. *Why does StayLocal check `req.cookies` first and then fallback to `req.headers.authorization`?*  
   **Answer:** Browsers automatically send HttpOnly cookies for security, while mobile apps, testing scripts, and external tools send Bearer tokens via authorization headers. Supporting both makes the API universal.
2. *How is TypeScript extended so that `req.user` does not cause compiler errors?*  
   **Answer:** Using declaration merging in [server/src/middleware/auth.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/auth.ts#L8-L15) to augment Express's global `Request` interface with `user?: AuthUser`.

### 11. Practical Exercise
Inspect [server/src/middleware/auth.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/auth.ts#L8-L15). Explain how the `declare global { namespace Express { interface Request { user?: AuthUser } } }` block provides type safety across all controllers.

---

## Concept 3: Role-Based Authorization Middleware (`requireRole`)

### 1. Concept Name
Higher-Order Role Authorization Factory (`requireRole`)

### 2. Simple Definition
A higher-order function that generates middleware to enforce Role-Based Access Control (RBAC). It checks the `req.user.role` attached by `authenticate()` against a whitelist of permitted roles (e.g. `'host'`, `'admin'`). If the role matches, it allows the request; if not, it rejects it with `403 Forbidden`.

### 3. Real-World Analogy
VIP backstage passes at a concert: `authenticate` checked your identity card to make sure you are a real person. `requireRole` checks whether your ticket says "General Admission", "Musician", or "Sound Engineer". A General Admission ticket cannot enter the control room.

### 4. Why Developers Need It
Authentication only answers *"Who are you?"*. Authorization answers *"What are you allowed to do?"*. A Tourist should never be allowed to approve host listings or reassign homestays.

### 5. How StayLocal Uses It
Used on host management endpoints (`requireRole('host', 'admin')`) and administrator governance routes (`requireRole('admin')`).

### 6. Actual File Location
- **File:** [server/src/middleware/auth.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/auth.ts#L50-L68)
- **Function:** `requireRole(...allowedRoles: UserRole[])`

### 7. Code Explanation
```typescript
// server/src/middleware/auth.ts
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Access requires one of the following roles: [${allowedRoles.join(
            ', '
          )}]. Your active role is '${req.user.role}'.`
        )
      );
    }

    next();
  };
}
```
- **Line 1:** Accepts a rest parameter of allowed roles (`'admin'`, `'host'`).
- **Line 2:** Returns a closure middleware function matching Express's signature.
- **Line 7:** `!allowedRoles.includes(req.user.role)` checks if user's role is in the whitelist.
- **Lines 8–14:** Passes a descriptive `ForbiddenError(403)` to `next(err)` if unauthorized.

### 8. Execution Flow
1. Tourist tries to access `POST /api/admin/assignments/:id/assign`.
2. `authenticate` verifies identity (`req.user = { role: 'tourist' }`).
3. `requireRole('admin')` checks `['admin'].includes('tourist')` $\rightarrow$ `false`.
4. Middleware calls `next(new ForbiddenError(...))`.
5. Error handler responds with HTTP 403 Forbidden.

### 9. Common Mistakes
- **Putting `requireRole` before `authenticate`:** If placed before `authenticate`, `req.user` will be undefined, causing every request to fail with 401.

### 10. Interview Questions
1. *What is a "higher-order middleware" function in Express?*  
   **Answer:** A function that takes configuration parameters (like a list of roles) and returns an actual middleware function `(req, res, next) => void`.
2. *What is the difference between HTTP 401 Unauthorized and HTTP 403 Forbidden?*  
   **Answer:** 401 means unauthenticated (we don't know who you are, or your token is expired); 403 means authenticated but unauthorized (we know who you are, but you do not have permission to access this resource).

### 11. Practical Exercise
Find a route in [server/src/routes/admin-assignment.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/admin-assignment.route.ts). Notice how every endpoint chains `authenticate, requireRole('admin')`.

---

## Concept 4: Request Validation Middleware (`validateBody` & `validateQuery`)

### 1. Concept Name
Declarative Schema Validation Middleware with Zod

### 2. Simple Definition
Middleware that validates incoming request payloads or query parameters against a predefined Zod schema before the controller executes. If the payload is invalid (missing fields, wrong data types, negative numbers), it halts execution and returns a structured 400 Bad Request error.

### 3. Real-World Analogy
A mail sorting machine with physical size and weight templates: before a letter is loaded onto the airplane, it must pass through a slot. If it's too thick or weighs too much, it is rejected at the sorting station rather than causing an overweight hazard on the plane.

### 4. Why Developers Need It
Controllers should never be polluted with 40 lines of manual type checks (`if (!req.body.name || typeof req.body.name !== 'string')`). Zod validates schemas declaratively and strips unwanted fields.

### 5. How StayLocal Uses It
In [server/src/validators/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/validators/index.ts#L60-L86), StayLocal exports `validateBody(schema)` and `validateQuery(schema)` used across booking, auth, and stay routes.

### 6. Actual File Location
- **File:** [server/src/validators/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/validators/index.ts#L60-L86)
- **Functions:** `validateBody()` and `validateQuery()`

### 7. Code Explanation
```typescript
// server/src/validators/index.ts
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
```
- **Line 4:** `schema.parseAsync(req.body)` parses the input body, coerces valid types, applies custom refinements, and strips undeclared keys.
- **Line 4:** Reassigns `req.body` to the sanitized, typed output of Zod.
- **Line 7:** If validation fails, Zod throws a `ZodError` passed directly to `next(err)`.

### 8. Execution Flow
1. User submits booking with `guestCount: -5`.
2. `validateBody(createBookingSchema)` intercepts the request.
3. Zod refinement fails: `"guestCount must be at least 1"`.
4. `next(err)` passes the `ZodError` to `errorHandler`.
5. Response: HTTP 400 Bad Request with field-level details.

### 9. Common Mistakes
- **Using `schema.parse()` synchronously on async schemas:** If your Zod schema uses async checks (e.g. database lookups), `schema.parse()` will fail. Always use `await schema.parseAsync()`.

### 10. Interview Questions
1. *What are the security benefits of schema validation on API request bodies?*  
   **Answer:** Prevents injection attacks, mass-assignment vulnerabilities (users passing unauthorized fields like `isAdmin: true`), and crashes caused by unhandled null/undefined properties.
2. *How does `validateBody` sanitize request data?*  
   **Answer:** Zod parses only the fields defined in the schema, stripping out unexpected properties by default.

### 11. Practical Exercise
Inspect [server/src/validators/booking.validator.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/validators/booking.validator.ts). Review `createBookingSchema` and note how check-out date is validated to ensure it is strictly after check-in date.

---

## Concept 5: Centralized Error-Handling Middleware (`errorHandler`)

### 1. Concept Name
Global Operational Error Handler Middleware

### 2. Simple Definition
An Express middleware function with four arguments `(err, req, res, next)` registered at the very end of the app. Whenever any controller, service, or middleware throws an error or calls `next(err)`, Express skips everything else and calls this function. It categorizes the error, logs it, and formats a clean JSON error response for the client.

### 3. Real-World Analogy
The emergency room triage desk: no matter which department an injury occurred in, all emergencies are routed to the central triage team, who assess the severity, apply the appropriate treatment protocol, and record the event.

### 4. Why Developers Need It
Without a centralized error handler, every single `try/catch` block in every controller must manually format JSON responses. If an unhandled promise rejection occurs, the server crashes. Centralized error handling guarantees that the client always receives a structured JSON error response and the server never crashes.

### 5. How StayLocal Uses It
In [server/src/middleware/errorHandler.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/errorHandler.ts), it catches Zod validation errors, operational `AppError` subclasses, JSON parse failures, and internal server errors.

### 6. Actual File Location
- **File:** [server/src/middleware/errorHandler.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/middleware/errorHandler.ts#L7-L72)
- **Function:** `errorHandler()`

### 7. Code Explanation
```typescript
// server/src/middleware/errorHandler.ts
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: formattedErrors.map(e => e.message).join('. '), details: formattedErrors },
    });
    return;
  }

  // 2. Custom App Operational Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // 4. Uncaught Internal Server Errors
  console.error('[ServerError] Unhandled exception:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    },
  });
}
```
- **Lines 7–11:** Inspects `err instanceof ZodError` and returns status 400.
- **Lines 20–28:** Inspects `err instanceof AppError` (custom domain errors) and returns the error's exact status code (e.g. 404 for `NotFoundError`, 409 for `ConflictError`).
- **Lines 31–41:** Catch-all for unexpected bugs (500). In production, it hides the raw stack trace from the user to prevent information disclosure vulnerabilities!

### 8. Execution Flow
1. Service throws `new ConflictError('Overlapping booking exists')`.
2. Controller `catch(err)` runs `next(err)`.
3. `errorHandler` catches the error.
4. Matches `err instanceof AppError` (statusCode: 409, code: 'CONFLICT').
5. Sends HTTP 409 Conflict JSON response.

### 9. Common Mistakes
- **Leaking Stack Traces in Production:** Returning `err.stack` to client browsers in production exposes your internal file paths, operating system details, and database structure to potential attackers.

### 10. Interview Questions
1. *How does Express distinguish error-handling middleware from standard middleware?*  
   **Answer:** By function arity (number of declared arguments): error handlers must have exactly four parameters: `(err, req, res, next)`.
2. *What is the difference between an operational error and a programming error?*  
   **Answer:** Operational errors are expected runtime conditions (e.g. invalid password, booking conflict, not found); programming errors are developer bugs (e.g. null pointer exceptions, syntax errors).

### 11. Practical Exercise
Inspect [server/src/utils/errors.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/utils/errors.ts). Identify the 7 custom error classes that inherit from `AppError`.
