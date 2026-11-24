# Module 5: Controllers & Services Architecture in StayLocal

> **Scope:** Layered architecture, separation of concerns, the Single Responsibility Principle, and end-to-end execution flow between Controllers and Services in StayLocal.  
> **Target Mastery:** Level 1 (Essential) to Level 2 (Intermediate)

---

## Concept 1: Separation of Concerns (Controllers vs. Services)

### 1. Concept Name
The Controller-Service Layered Architectural Pattern

### 2. Simple Definition
A software architecture pattern where the **Controller** is strictly responsible for handling HTTP communication (unpacking request params, cookies, bodies, and sending JSON responses), while the **Service** is strictly responsible for business rules, calculations, database queries, and domain logic. A Service has zero knowledge of Express, `req`, or `res`.

### 3. Real-World Analogy
Think of a bank:
- **The Controller is the Bank Teller:** Sits at the counter, greets the customer, accepts deposit slips, verifies ID, and hands back cash receipts. The teller doesn't calculate interest rates or move money between vault accounts.
- **The Service is the Core Banking System:** Validates account limits, updates ledger balances, computes compound interest, and executes transfers. The core system doesn't care whether the request came from an in-person teller, an ATM, or a mobile phone.

### 4. Why Developers Need It
In beginner codebases, developers write 300-line route handlers that parse params, query MongoDB, compute bed math, send emails, and format JSON all in one giant function.
This causes:
1. **Zero Code Reusability:** If a CLI script or cron job needs to confirm a booking, it cannot reuse the logic because it is trapped inside an Express `(req, res)` handler.
2. **Untestable Code:** Testing business logic forces you to simulate artificial HTTP requests with mocked headers and cookie objects.
3. **High Coupling:** Upgrading Express or switching to another transport protocol breaks business logic.

### 5. How StayLocal Uses It
In StayLocal:
- **Controllers** ([server/src/controllers/](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/)) only interact with Express `Request`, `Response`, and `NextFunction`.
- **Services** ([server/src/services/](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/)) accept plain JavaScript data (`AuthUser`, `stayId: string`, `input: CreateBookingInput`) and return pure domain objects or throw typed `AppError` exceptions.

```mermaid
flowchart LR
    Client["Client HTTP Request"] --> Controller["Controller\n(Extracts req.body, req.user)"]
    Controller -->|Pure JS Parameters| Service["Service Layer\n(Domain Rules, Math, Transactions)"]
    Service -->|Mongoose Queries| Database[("MongoDB Atlas")]
    Database -->|Documents| Service
    Service -->|Domain Records| Controller
    Controller -->|res.status(200).json()| Client
```

### 6. Actual File Location
- **Controller:** [server/src/controllers/booking.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/booking.controller.ts#L6-L23)
- **Service:** [server/src/services/booking.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/booking.service.ts#L33-L120)

### 7. Code Explanation
```typescript
// CONTROLLER: server/src/controllers/booking.controller.ts
export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    // 1. Unpack HTTP transport parameters
    const booking = await BookingService.createBooking(req.user, req.body);
    // 2. Format HTTP response
    res.status(201).json({
      success: true,
      data: { booking },
      message: 'Booking request created successfully.',
    });
  } catch (err) {
    next(err); // 3. Delegate errors to central pipeline
  }
}
```
Notice how clean the controller is! Exactly 14 lines:
1. Verifies authentication check.
2. Delegates the heavy lifting to `BookingService.createBooking`.
3. Returns status 201 with standard response payload.

Now inspect the Service:
```typescript
// SERVICE: server/src/services/booking.service.ts
export class BookingService {
  static async createBooking(touristUser: AuthUser, input: CreateBookingInput): Promise<BookingRecord> {
    // 1. Check database connectivity
    // 2. Query homestay
    // 3. Parse date and time policies
    // 4. Calculate bed capacity and cleaning buffers
    // 5. Generate secure booking reference (e.g. SLB-7K9F2Q)
    // 6. Save pending booking to MongoDB
    // 7. Return plain domain record
  }
}
```
Notice: `BookingService` has **no Express imports, no `req`, no `res`, and no `next`**. It is a pure, portable TypeScript class.

### 8. Execution Flow
1. HTTP POST request arrives with JSON body.
2. `createBooking` controller unmarshals `req.body` and `req.user`.
3. Controller passes parameters to `BookingService.createBooking`.
4. Service performs database lookups, bed math, and saves.
5. Service returns `BookingRecord`.
6. Controller wraps it in `{ success: true, data: { booking } }` and responds with 201 Created.

### 9. Common Mistakes
- **Passing `req` or `res` into a Service:** Writing `BookingService.createBooking(req, res)` destroys the separation of concerns. The service becomes tightly coupled to Express HTTP transport. Pass only extracted domain parameters (`touristUser`, `input`).

### 10. Interview Questions
1. *What is the Single Responsibility Principle, and how does the Controller-Service pattern satisfy it?*  
   **Answer:** SRP states that a class or module should have only one reason to change. Controllers change only when HTTP transport concerns change (headers, status codes, route params); Services change only when business logic or domain rules change (pricing, capacity, policies).
2. *Can a service call another service in this architecture?*  
   **Answer:** Yes. For example, `BookingService` delegates bed availability calculations to `AvailabilityService`, and broadcasts events via `RealtimeService`.

### 11. Practical Exercise
Inspect [server/src/controllers/admin-assignment.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/admin-assignment.controller.ts#L6-L25). Notice how `getAssignments` unpacks `req.query` and passes it to `AdminAssignmentService.getAssignments(filters)`.

---

## Concept 2: Detailed Walkthrough — `AdminAssignmentController` & `AdminAssignmentService`

Let's examine how complex enterprise workflows flow through the Controller-Service boundary in StayLocal's administrative homestay assignment subsystem.

### 1. The Controller ([admin-assignment.controller.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/controllers/admin-assignment.controller.ts))
```typescript
// server/src/controllers/admin-assignment.controller.ts
export async function assignHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const stayId = req.params.id as string;
    const { hostId, reason } = req.body;

    const stay = await AdminAssignmentService.assignHost(req.user, {
      stayId,
      hostId,
      reason,
    });

    res.status(200).json({
      success: true,
      data: { stay },
      message: 'Host successfully assigned to homestay.',
    });
  } catch (err) {
    next(err);
  }
}
```
**Responsibilities of the Controller:**
- Checks `req.user` existence.
- Extracts `stayId` from route parameter `req.params.id`.
- Extracts `hostId` and `reason` from request body `req.body`.
- Calls `AdminAssignmentService.assignHost(req.user, payload)`.
- Returns standardized JSON format.
- Passes exceptions to `next(err)`.

### 2. The Service ([admin-assignment.service.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/services/admin-assignment.service.ts))
```typescript
// server/src/services/admin-assignment.service.ts
export class AdminAssignmentService {
  static async assignHost(adminUser: AuthUser, payload: AssignHostPayload): Promise<AccommodationRecord> {
    // 1. Role Enforcement
    if (adminUser.role !== 'admin') {
      throw new ForbiddenError('Only platform administrators can assign hosts.');
    }

    // 2. Database Connectivity Guard
    if (isDatabaseConfigured() && !isDatabaseConnected()) {
      throw new DatabaseError('Database service unavailable.');
    }

    // 3. Entity Lookups
    const stay = await StayModel.findOne({ id: payload.stayId.toLowerCase() });
    if (!stay) throw new NotFoundError(`Homestay '${payload.stayId}' was not found.`);

    const host = await UserModel.findOne({ id: payload.hostId });
    if (!host) throw new NotFoundError(`Host account '${payload.hostId}' not found.`);

    // 4. Domain Invariant: Strictly only 'host' role with 'active' status
    if (host.role !== 'host') {
      throw new BadRequestError(`User '${host.fullName}' is registered as '${host.role}'. Only hosts can be assigned.`);
    }
    if (host.status !== 'active') {
      throw new BadRequestError(`Cannot assign suspended host account.`);
    }

    // 5. Assignment Conflict Checks
    if (stay.hostId === host.id && stay.assignmentStatus === 'assigned') {
      throw new BadRequestError(`'${stay.name}' is already assigned to this host.`);
    }
    if (stay.hostId && stay.hostId !== host.id && stay.assignmentStatus === 'assigned') {
      throw new BadRequestError(`Property is already assigned to another host. Use Reassignment action.`);
    }

    // 6. Update Assignment Fields
    const assignedAt = new Date();
    stay.hostId = host.id;
    stay.assignedHostId = host.id;
    stay.assignedHostName = host.fullName;
    stay.assignedHostEmail = host.email;
    stay.assignedAt = assignedAt;
    stay.assignedBy = adminUser.id;
    stay.assignedByName = adminUser.fullName;
    stay.assignmentStatus = 'assigned';
    stay.isPreloaded = true;

    // 7. Property Verification Reset Rule
    if (stay.verificationStatus === 'verified') {
      stay.verificationStatus = 'verification_pending';
      stay.publicationStatus = 'draft';
      stay.verificationNotes = `Assigned to host ${host.fullName}. Awaiting host authorization submission.`;
    }

    // 8. Immutable Audit Trail Append
    if (!stay.assignmentHistory) stay.assignmentHistory = [];
    stay.assignmentHistory.push({
      hostId: host.id,
      hostName: host.fullName,
      hostEmail: host.email,
      assignedBy: adminUser.id,
      assignedByName: adminUser.fullName,
      assignedAt,
      action: 'assigned',
      reason: payload.reason || 'Admin assigned host to preloaded homestay',
    });

    await stay.save();
    return toStayRecord(stay);
  }
}
```

### 3. Key Architectural Takeaways
1. **Business Rules Live in the Service:**
   Notice Rule #7: If a homestay was previously verified, assigning it to a new host sets its status to `'verification_pending'` and `'draft'` so the new host must prove authorization before the listing can accept bookings. The controller doesn't know this rule exists; the service enforces it automatically.
2. **Audit Preservation:**
   Notice Rule #8: `stay.assignmentHistory.push(...)` records who performed the action, their user ID, the timestamp, and the justification.
3. **Pure Function Signatures:**
   Notice that `AdminAssignmentService.assignHost` can easily be called from a CLI migration script (`reset-host-assignments.ts`), a unit test, or an Express route.

---

## Concept 3: Standardized API Response Formatting

### 1. Concept Name
Uniform Envelope API Response Contract

### 2. Simple Definition
The practice of wrapping every successful response in a standardized JSON structure (`{ success: true, data: { ... }, message?: string, meta?: { ... } }`) and every failure in an identical error structure (`{ success: false, error: { code, message, details } }`).

### 3. Real-World Analogy
Company letterhead: every official document sent by an organization carries the company logo, date, reference number, and standardized body structure, so the recipient never has to guess where to find the author or the content.

### 4. Why Developers Need It
If Endpoint A returns `{ user: { ... } }`, Endpoint B returns `[ { ... } ]`, and Endpoint C returns `{ data: [ ... ], status: 'ok' }`, the frontend developer is forced to write different parsing logic for every single endpoint. A uniform envelope allows the frontend API client (`apiService`) to use one generic interceptor.

### 5. How StayLocal Uses It
Defined in [server/src/types/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/types/index.ts#L4-L24): `ApiSuccessResponse<T>` and `ApiErrorResponse`.

### 6. Actual File Location
- **File:** [server/src/types/index.ts](file:///c:/Users/HP/Downloads/Major%20Project/server/src/types/index.ts#L4-L24)

### 7. Code Explanation
```typescript
// server/src/types/index.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```
- Every successful controller responds with `ApiSuccessResponse<T>`.
- The centralized `errorHandler` always responds with `ApiErrorResponse`.

### 8. Interview Questions
1. *What are the benefits of using a uniform JSON envelope for REST APIs?*  
   **Answer:** Predictable client parsing, consistent error handling, metadata support for pagination (`meta: { total, page }`), and simpler TypeScript typing.
2. *Should the HTTP status code be duplicated inside the JSON envelope?*  
   **Answer:** Not necessary if the HTTP status header is used properly, though some APIs include it for clients that cannot easily read status headers. StayLocal uses standard HTTP status headers alongside error codes (`code: 'NOT_FOUND'`).
