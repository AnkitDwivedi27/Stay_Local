# Module 2: Express.js & REST API Architecture in StayLocal

> **Scope:** Express application structure, HTTP methods, request/response lifecycle, parameters, headers, status codes, REST principles, and endpoint mapping in StayLocal.  
> **Target Mastery:** Level 1 (Essential) to Level 2 (Intermediate)

---

## Concept 1: The Express Application & Factory Pattern (`createApp`)

### 1. Concept Name
Express Application Instance & Factory Architecture (`createApp()`)

### 2. Simple Definition
An Express application is an object that configures how your server receives HTTP requests, pipes them through middleware, and routes them to handler functions. The **Factory Pattern** encapsulates application creation inside a function (`createApp()`) rather than instantiating a top-level singleton, allowing test suites to spin up isolated app instances without port binding.

### 3. Real-World Analogy
Think of an Express app as a building with security gates, baggage scanners (middleware), and an internal directory of offices (routes). A factory function (`createApp`) is the master blueprint that can construct identical buildings for production use or for testing drills without interfering with each other.

### 4. Why Developers Need It
If you bind `app.listen(5000)` directly in the same file where your Express routes are defined, running automated tests (e.g., with Supertest) will try to open port 5000 repeatedly, throwing `EADDRINUSE: address already in use`. Decoupling `createApp()` in `app.ts` from `server.listen()` in `server.ts` enables clean, isolated integration testing.

### 5. How StayLocal Uses It
In [server/src/app.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/app.ts#L11-L61), `createApp()` configures CORS, cookie parsers, body parsers, mounts `/api`, and attaches error handlers. [server/src/server.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/server.ts) imports `app` and listens on port 5000, while integration tests in `server/tests/` import `app` directly for supertest simulations.

### 6. Actual File Location
- **File:** [server/src/app.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/app.ts#L11-L59)
- **Function:** `createApp(): Application`

### 7. Code Explanation
```typescript
// server/src/app.ts
export function createApp(): Application {
  const app = express();

  // 1. Cross-Origin Resource Sharing
  app.use(cors({ ... }));

  // 2. Cookie & Body Parser Middleware
  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // 3. Mount API Routes
  app.use('/api', apiRouter);

  // 5. Catch-all 404 Handler for API routes
  app.use(notFoundHandler);

  // 6. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
```
- **Line 2:** `express()` creates the HTTP pipeline instance.
- **Lines 5–10:** Registers standard request-preparation middleware.
- **Line 13:** Mounts all project endpoints under the `/api` prefix.
- **Lines 16–19:** Standard error and 404 middleware registered strictly at the end of the pipeline.

### 8. Execution Flow
1. When `server.ts` boots, it calls `createApp()`.
2. Middleware layers are stacked in exact chronological order.
3. Routers are linked into the tree.
4. The configured application pipeline is returned and bound to the network port.

### 9. Common Mistakes
- **Mounting Error Handlers First:** Express identifies error-handling middleware by its 4-parameter signature `(err, req, res, next)`. If placed *before* routes, it will never intercept errors thrown in route handlers.

### 10. Interview Questions
1. *Why should you separate `app.ts` (Express configuration) from `server.ts` (network port listening)?*  
   **Answer:** To separate concerns and allow Supertest integration tests to execute HTTP assertions against `app` in memory without opening live TCP ports or causing port collision errors.
2. *How does Express process requests through its middleware stack?*  
   **Answer:** In sequential pipeline order: each middleware executes, performs an operation, and either ends the request via `res.send()` or passes control to the next layer by calling `next()`.

### 11. Practical Exercise
Inspect [server/src/app.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/app.ts#L41-L50). Notice lines 41–50: if `client/dist` exists on disk, Express serves the static frontend assets and routes non-API requests to `index.html`. Explain how this enables unified single-server deployments.

---

## Concept 2: Route Modularization with `express.Router()`

### 1. Concept Name
Modular Mini-Applications (`express.Router()`)

### 2. Why It Exists
In a small demo app, writing all routes in one file (`app.get('/stays', ...)`, `app.post('/login', ...)`) works. In an enterprise system with 40+ endpoints spanning auth, homestays, bookings, host listings, artisan treasures, and guides, a single file becomes thousands of lines of unmaintainable spaghetti code. `express.Router()` creates isolated, modular sub-routers.

### 3. Real-World Analogy
An international airport terminal: instead of a single massive gate for all flights, the terminal divides into Concourses A, B, C, and D (Sub-routers). Concourse B handles international departures (Auth routes), while Concourse C handles domestic flights (Booking routes).

### 4. Why Developers Need It
Router modularization enforces the **Single Responsibility Principle**. Each domain subsystem owns its specific file (e.g. `booking.route.ts`, `auth.route.ts`), which can be mounted, secured, or refactored independently.

### 5. How StayLocal Uses It
In [server/src/routes/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/index.ts), StayLocal instantiates `apiRouter = Router()` and mounts 15 domain sub-routers (`bookingRouter`, `authRouter`, `staysRouter`, `hostListingRouter`, etc.).

### 6. Actual File Location
- **File:** [server/src/routes/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/index.ts#L18-L35) and [server/src/routes/booking.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/booking.route.ts#L1-L40)

### 7. Code Explanation
```typescript
// server/src/routes/booking.route.ts
export const bookingRouter = Router();

bookingRouter.post(
  '/bookings',
  authenticate,
  validateBody(createBookingSchema),
  createBooking
);

bookingRouter.get(
  '/bookings/my',
  authenticate,
  getMyBookings
);

bookingRouter.patch(
  '/bookings/:id/confirm',
  authenticate,
  requireRole('host', 'admin'),
  confirmBooking
);
```
- **Line 1:** `Router()` instantiates a dedicated router for booking operations.
- **Lines 3–8:** Declares `POST /bookings` guarded by `authenticate` and Zod payload validation before reaching `createBooking`.
- **Lines 16–21:** Declares `PATCH /bookings/:id/confirm` requiring both authentication and `role: 'host' | 'admin'`.

### 8. Execution Flow
1. Client requests `PATCH /api/bookings/bk_101/confirm`.
2. Main app passes `/api/*` to `apiRouter` ([app.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/app.ts#L38)).
3. `apiRouter` delegates to `bookingRouter` ([routes/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/index.ts#L22)).
4. `bookingRouter` matches `/bookings/:id/confirm` and verb `PATCH`.
5. Handlers execute in left-to-right order: `authenticate` $\rightarrow$ `requireRole` $\rightarrow$ `confirmBooking`.

### 9. Common Mistakes
- **Forgetting to Export/Import the Router:** Defining routes on a router but forgetting to export it or mount it in `routes/index.ts` leads to `404 Not Found` errors.

### 10. Interview Questions
1. *What is an Express Router, and how does it differ from the main `app` object?*  
   **Answer:** An `express.Router` is an isolated instance of middleware and routes (a "mini-app") that cannot listen on network ports directly; it must be mounted onto a parent router or the main `app`.
2. *Can routers be nested inside other routers?*  
   **Answer:** Yes, routers can be mounted inside other routers indefinitely (`parentRouter.use('/subpath', childRouter)`), allowing hierarchical API architectures.

### 11. Practical Exercise
Inspect [server/src/routes/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/index.ts). Count the total number of sub-routers mounted onto `apiRouter`.

---

## Concept 3: Request & Response Objects (`req` and `res`)

### 1. Concept Name
The HTTP Request (`Request`) & Response (`Response`) Abstractions

### 2. Simple Definition
Whenever a client connects to Express, Express wraps the incoming HTTP network stream in a `req` (Request) object and provides a `res` (Response) object. `req` contains everything the client sent (URL parameters, query strings, headers, cookies, body), while `res` contains methods to send data, set headers, and assign status codes back to the client.

### 3. Real-World Analogy
`req` is the incoming requisition letter arriving on your desk with stamps and attachments. `res` is your outgoing stationery: your official letterhead, your stamp seal, and the outgoing mailbox.

### 4. Why Developers Need It
Raw TCP and HTTP streams are streams of raw byte chunks. Express parses and normalizes these streams so developers can access `req.params.id` or `req.body.checkIn` as clean JavaScript variables, and send responses using `res.status(200).json(...)`.

### 5. How StayLocal Uses It
Every controller in `server/src/controllers/` accepts `(req: Request, res: Response, next: NextFunction)`. Controllers inspect `req.params`, `req.query`, and `req.body`, and return responses via `res.status(...).json(...)`.

### 6. Actual File Location
- **File:** [server/src/controllers/booking.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/booking.controller.ts#L60-L75)

### 7. Code Explanation
```typescript
// server/src/controllers/booking.controller.ts
export async function confirmBooking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const bookingId = req.params.id as string;
    const booking = await BookingService.confirmBooking(req.user, bookingId);
    res.status(200).json({
      success: true,
      data: { booking },
      message: 'Booking confirmed successfully.',
    });
  } catch (err) {
    next(err);
  }
}
```
- **Line 7:** `req.user` was attached upstream by the authentication middleware.
- **Line 8:** `req.params.id` extracts the booking ID from the dynamic path segment `:id`.
- **Lines 10–14:** `res.status(200).json(...)` sets the HTTP status code to 200 OK and serializes the JavaScript object into JSON.

### 8. Execution Flow
1. Client sends HTTP request.
2. Express parses headers and body, creating `req` and `res`.
3. Controller reads `req.params.id`.
4. Controller calls `res.status(200).json(...)`.
5. Express sets `Content-Type: application/json; charset=utf-8`, writes the response body, and closes the TCP connection.

### 9. Common Mistakes
- **Double Sending (`ERR_HTTP_HEADERS_SENT`):** Calling `res.json(...)` twice in the same request path, or failing to use `return` after sending an error response, causes Node to crash with `Cannot set headers after they are sent to the client`.

### 10. Interview Questions
1. *What is the difference between `res.send()`, `res.json()`, and `res.end()`?*  
   **Answer:** `res.send()` sends various types (strings, buffers, HTML); `res.json()` explicitly converts objects to JSON strings and sets `Content-Type: application/json`; `res.end()` quickly ends the response without sending a body.
2. *How do `req.params`, `req.query`, and `req.body` differ?*  
   **Answer:** `req.params` contains dynamic URL route segments (`/stays/:id`); `req.query` contains URL query string parameters (`/stays?district=Pithoragarh`); `req.body` contains the parsed JSON payload sent in POST/PUT/PATCH requests.

### 11. Practical Exercise
Write a controller handler for `GET /api/ping` that inspects `req.headers['user-agent']` and returns `{ success: true, clientAgent: ... }` with status 200.

---

## Concept 4: Complete StayLocal API Endpoint Catalog

StayLocal defines **42 specialized REST API endpoints** categorized by domain:

### 1. Authentication Endpoints ([server/src/routes/auth.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/auth.route.ts))
- `POST /api/auth/register` (Public, Rate-Limited): Registers a new user (`tourist`, `host`, `guide`), hashes password with bcrypt, sets `HttpOnly` cookie.
- `POST /api/auth/login` (Public, Rate-Limited): Verifies email and password, signs JWT, sets `HttpOnly` cookie.
- `POST /api/auth/logout` (Public): Clears `staylocal_token` cookie from client.
- `GET /api/auth/me` (Authenticated): Returns the active logged-in user profile.
- `GET /api/auth/host-only` (Guarded: `host`, `admin`): Verification ping for host portal.
- `GET /api/auth/admin-only` (Guarded: `admin`): Verification ping for administrator portal.

### 2. Homestay Discovery & Availability ([server/src/routes/stays.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/stays.route.ts))
- `GET /api/stays` (Public): Catalog search filtered by destination, district, category, verification status, and min guests.
- `GET /api/stays/:id` (Public): Deep property profile with amenities, policies, and host contact.
- `POST /api/stays/:id/availability` (Public): Real-time bed availability calculation taking cleaning buffers into account.
- `GET /api/stays/:id/availability/stream` (Public, SSE): Real-time Server-Sent Events availability event stream.

### 3. Tourist Booking Endpoints ([server/src/routes/booking.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/booking.route.ts))
- `POST /api/bookings` (Guarded: `tourist`, `admin`): Submits a pending homestay reservation request.
- `GET /api/bookings/my` (Guarded: Authenticated): Returns all homestay bookings belonging to the requesting user.
- `GET /api/bookings/:id` (Guarded: Authenticated): Returns booking details with strict owner access verification.
- `PATCH /api/bookings/:id/cancel` (Guarded: Authenticated): Traveler cancels a pending reservation.

### 4. Host Listing & Booking Operations ([server/src/routes/host-listing.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/host-listing.route.ts) & [booking.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/booking.route.ts))
- `GET /api/host/listings` (Guarded: `host`, `admin`): Retrieves all properties owned by or assigned to the host.
- `POST /api/host/listings` (Guarded: `host`, `admin`): Creates a new homestay listing bound strictly to the host's ID.
- `PUT /api/host/listings/:id` (Guarded: `host`, `admin`): Updates property details, policies, and pricing.
- `POST /api/host/listings/:id/submit-verification` (Guarded: `host`, `admin`): Submits Base64 authorization documents to verification queue.
- `GET /api/host/verification-documents/:id/:documentId` (Guarded: `host`, `admin`): Securely downloads property ownership document.
- `PATCH /api/host/listings/:id/deactivate` (Guarded: `host`, `admin`): Delists or archives property.
- `GET /api/host/bookings` (Guarded: `host`, `admin`): Host reviews reservations across all managed homestays.
- `PATCH /api/bookings/:id/confirm` (Guarded: `host`, `admin`): Atomically confirms reservation and locks bed capacity.
- `PATCH /api/bookings/:id/reject` (Guarded: `host`, `admin`): Declines request and frees reserved bed capacity.

### 5. Administrative Governance ([server/src/routes/admin-assignment.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/admin-assignment.route.ts) & [admin-listing.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/admin-listing.route.ts))
- `GET /api/admin/assignments` (Guarded: `admin`): Lists homestays filtered by assignment status (`assigned` vs `unassigned`).
- `GET /api/admin/assignments/eligible-hosts` (Guarded: `admin`): Lists registered, active hosts eligible for property assignment.
- `POST /api/admin/assignments/:id/assign` (Guarded: `admin`): Binds a preloaded homestay to an active host.
- `POST /api/admin/assignments/:id/reassign` (Guarded: `admin`): Reassigns homestay to a different host with audit notes.
- `POST /api/admin/assignments/:id/unassign` (Guarded: `admin`): Unassigns property (aborts if active bookings exist).
- `GET /api/admin/verification/stays` (Guarded: `admin`): Reviews pending homestay verification queue.
- `PATCH /api/admin/verification/stays/:id` (Guarded: `admin`): Approves or rejects property verification with audit notes.

### 6. System Health ([server/src/routes/health.route.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/routes/health.route.ts))
- `GET /api/health` (Public): Returns service uptime, environment mode, and MongoDB Atlas connectivity status.
